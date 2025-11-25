import { model } from "@medusajs/framework/utils"

// 定义数据库表结构
export const ChatMessage = model.define("message", {
  id: model.id().primaryKey(),
  order_id: model.text().searchable(), // 关联订单ID
  sender_type: model.enum(["customer", "admin"]), // 发送者类型
  content: model.text(), // 消息内容
})