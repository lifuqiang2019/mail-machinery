import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Button, clx } from "@medusajs/ui"
import { useState, useEffect, useRef } from "react"

// Widget 接收 data.id (即 order_id)
const OrderChatWidget = ({ data }: { data: { id: string } }) => {
  const orderId = data.id
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 后端 API 地址 (通常 Admin 和 Server 同源，如果不同请修改)
  const API_URL = "http://localhost:9000"

  const fetchMessages = async () => {
    try {
      // 注意：这里用 /chat 接口，不要用 /store/chat
      const res = await fetch(`${API_URL}/chat?order_id=${orderId}`)
      const json = await res.json()
      if (json.messages) setMessages(json.messages)
    } catch (e) {
      console.error("Admin fetch error:", e)
    }
  }

  // 轮询：每 3 秒刷新，看看顾客有没有新消息
  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [orderId])

  // 自动滚动到底部
  useEffect(() => {
    if (bottomRef.current) {
      const { scrollHeight, clientHeight } = bottomRef.current
      // 直接修改容器的 scrollTop，绝不会影响外层页面
      bottomRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth"
      })
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim()) return
    setLoading(true)
    
    // 乐观更新
    const tempMsg = {
        id: "temp-" + Date.now(),
        content: inputValue,
        sender_type: "admin", // 标记为客服
        created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])
    const msgToSend = inputValue
    setInputValue("")

    await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        content: msgToSend,
        sender_type: "admin", // 客服发送
      }),
    })
    
    await fetchMessages() // 重新拉取以确认状态
    setLoading(false)
  }

  return (
    <Container className="p-0 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b bg-gray-50">
        <Heading level="h2">💬 实时沟通 (Order Chat)</Heading>
      </div>
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-white" ref={bottomRef}>
        {messages.length === 0 && <Text className="text-gray-400 text-center mt-10">暂无记录</Text>}
        
        {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin"
            return (
              <div
                key={msg.id}
                className={clx(
                  "p-3 rounded-lg max-w-[85%] text-sm",
                  isAdmin
                    ? "bg-blue-100 self-end text-right rounded-br-none" // 客服在右
                    : "bg-gray-100 self-start text-left rounded-bl-none" // 顾客在左
                )}
              >
                <div className="font-bold text-[10px] text-gray-400 mb-1">
                  {isAdmin ? "客服 (我)" : "顾客"}
                </div>
                <div className="text-gray-800">{msg.content}</div>
              </div>
            )
        })}
        {/* <div ref={bottomRef} /> */}
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t flex gap-2 bg-gray-50">
        <Input 
          placeholder="回复顾客..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend} isLoading={loading}>发送</Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderChatWidget