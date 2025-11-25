import { MedusaService } from "@medusajs/framework/utils"
import { ChatMessage } from "./models/message"

// MedusaService 是一个工厂函数，它会自动为你生成标准的 CRUD 方法
// 我们把 ChatMessage 模型传进去
class ChatModuleService extends MedusaService({
  message: ChatMessage,
}) {}

export default ChatModuleService