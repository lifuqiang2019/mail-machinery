import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.query

  // 1. 如果没有 order_id，返回空数组
  if (!order_id) {
    res.json({ messages: [] })
    return
  }

  // 2. 获取 Query 工具
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // 3. 查询数据库
  // 🔴 关键点：entity 必须是 "message" (因为你之前改过模型名)
  const { data: messages } = await query.graph({
    entity: "message", 
    fields: ["*"], // 查所有字段：id, content, sender_type, created_at
    filters: {
      order_id: order_id,
    },
  })

  // 4. 按时间排序 (旧的在上面，新的在下面)
  const sortedMessages = messages.sort((a: any, b: any) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // 5. 返回给前端
  res.json({ messages: sortedMessages })
}

// 别忘了 POST 方法也要改！
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // 🔴 关键修改 1：不直接 resolve "chatModule"，而是 resolve 它的 Service 实例
  // 注意：这里需要确保 key 和 medusa-config.ts 里的一致
  const chatService = req.scope.resolve("chatModule")

  const { order_id, content, sender_type } = req.body

  // 🔴 关键修改 2：使用 createMessages 而不是 create
  // MedusaService 生成的默认方法通常遵循 create + Model名(复数) 的规则
  // 如果你的 Model 叫 "message" (上一轮改的)，那么方法名应该是 createMessages
  
  try {
    // 尝试方案 A: 标准生成方法 (create + 复数Model名)
    const message = await chatService.createMessages({
      order_id,
      content,
      sender_type: sender_type || "customer",
    })
    res.json({ message })
  } catch (error) {
    console.log("尝试 createMessages 失败，尝试通用 create...", error.message)
    
    try {
      // 尝试方案 B: 通用 create 方法 (显式指定 Model Key)
      // 如果你的 Model Key 是 "message"
      const message = await chatService.create("message", {
        order_id,
        content,
        sender_type: sender_type || "customer",
      })
      res.json({ message })
    } catch (finalError) {
      console.error("所有创建方法都失败了:", finalError)
      res.status(500).json({ 
        message: "Internal Server Error", 
        detail: finalError.message,
        availableMethods: Object.keys(chatService), // 打印出来看看到底有啥
        prototypeMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(chatService))
      })
    }
  }
}