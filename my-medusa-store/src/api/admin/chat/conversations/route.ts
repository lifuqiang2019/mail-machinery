import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("📨 [API] GET /admin/chat/conversations called")
  const chatModule = req.scope.resolve("chatModule")
  
  const messages = await chatModule.listMessages({}, {
    order: { created_at: "DESC" },
    take: 1000 
  })
  
  const conversationsMap = new Map()
  
  for (const msg of messages) {
    if (!msg.user_id) continue
    
    if (!conversationsMap.has(msg.user_id)) {
      conversationsMap.set(msg.user_id, {
        user_id: msg.user_id,
        last_message: msg,
        unread_count: 0 
      })
    }
  }
  
  res.json({ conversations: Array.from(conversationsMap.values()) })
}

