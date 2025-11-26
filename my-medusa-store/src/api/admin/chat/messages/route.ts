import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const chatModule = req.scope.resolve("chatModule")
  const userId = req.query.user_id as string

  if (!userId) {
    res.status(400).json({ message: "user_id is required" })
    return
  }
  
  const messages = await chatModule.listMessages({
    user_id: userId
  }, {
    order: { created_at: "ASC" }
  })
  
  res.json({ messages })
}

