import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const chatModule = req.scope.resolve("chatModule")
  const userId = req.query.user_id as string

  if (!userId) {
    res.status(400).json({ message: "user_id is required" })
    return
  }

  try {
    // 直接在 API 路由内部设置 CORS 头作为双重保险
    const origin = req.headers.origin || "*"
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Credentials", "true")

    const messages = await chatModule.listMessages({
      user_id: userId
    }, {
      order: { created_at: "ASC" }
    })
    
    res.json({ messages })
  } catch (e: any) {
    console.error("Error listing messages:", e)
    res.status(500).json({ message: "Internal Server Error", error: e.message })
  }
}

// 显式处理 OPTIONS 请求
export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  const origin = req.headers.origin || "*"
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.status(204).end()
}
