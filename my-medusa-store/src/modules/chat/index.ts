import { Module } from "@medusajs/framework/utils"
import ChatModuleService from "./service"
import { ChatMessage } from "./models/message"

export const CHAT_MODULE = "chatModule"

export default Module(CHAT_MODULE, {
  service: ChatModuleService,
  models: [ChatMessage],
})
