import { Module } from "@medusajs/framework/utils"
import ChatModuleService from "./service"
import { ChatMessage } from "./models/message"

export const CHAT_MODULE = "chatModule"

export default Module(CHAT_MODULE, {
  service: ChatModuleService, // <--- 这里必须是 Service 类，不能是 {}
  models: [ChatMessage], // 🔴 这一行必须有，否则 Service 不知道怎么关联 Model
})