import { model } from "@medusajs/framework/utils"

// 定义数据库表结构
export const ChatMessage = model.define("message", {
  id: model.id().primaryKey(),
  order_id: model.text().searchable().nullable(), // 关联订单ID (可能是空的，如果是从详情页进来)
  user_id: model.text().searchable(), // 关联用户ID
  sender_type: model.enum(["customer", "admin", "system"]), // 发送者类型
  content: model.text(), // 消息内容
  metadata: model.json().nullable(), // 额外信息 (比如商品详情)
})