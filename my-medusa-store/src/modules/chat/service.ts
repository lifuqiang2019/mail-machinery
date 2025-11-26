import { MedusaService } from "@medusajs/framework/utils"
import { ChatMessage } from "./models/message"
import { Server } from "socket.io"

class ChatModuleService extends MedusaService({
  message: ChatMessage,
}) {
  constructor() {
    // @ts-ignore
    super(...arguments)
    this.initSocket()
  }

  initSocket() {
    if ((global as any).io) {
      console.log("♻️ [ChatService] Socket.io reference exists, skipping.")
      return
    }

    console.log("🚀 [ChatService] Initializing Socket.io...")

    try {
      const io = new Server(7002, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      })

      ;(global as any).io = io
      console.log("✅ [ChatService] Socket.io running on port 7002")

      io.on("connection", (socket) => {
        console.log("🔌 [Socket.io] New connection:", socket.id)

        socket.on("join_room", (roomId) => {
          socket.join(roomId)
        })

        socket.on("send_message", async (data) => {
          const { room_id, user_id, sender_type, content, metadata, order_id } = data
          
          // Broadcast
          io.to(room_id).emit("receive_message", data)
          if (sender_type === "customer") {
             io.to("admin").emit("receive_message", data)
          }

          // Persist
          try {
            await this.createMessages({
              user_id,
              order_id: order_id || null,
              sender_type,
              content,
              metadata: metadata || null,
            })
          } catch (err) {
            console.error("❌ Failed to save message:", err)
          }
        })
      })
    } catch (e: any) {
      console.warn("⚠️ [ChatService] Failed to start Socket.io (probably port 7002 in use):", e.message)
    }
  }
}

export default ChatModuleService
