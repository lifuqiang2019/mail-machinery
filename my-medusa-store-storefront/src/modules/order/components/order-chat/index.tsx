"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@medusajs/ui"

// 简单配置一下后端地址，确保和之前调通的 GET 地址一致
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

type OrderChatProps = {
  orderId: string
}

export default function OrderChat({ orderId }: OrderChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  
  // 增加一个 Ref 用于自动滚动到底部
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. 获取消息的方法
  const fetchMessages = async () => {
    try {
      console.log("🚀 [前端] 准备发起 GET 请求获取消息, OrderID:", orderId) // <--- 埋点 1
      console.log(`${BACKEND_URL}/chat?order_id=${orderId}`);
      
      const res = await fetch(`${BACKEND_URL}/chat?order_id=${orderId}`)
      console.log("    后端响应状态码:") // <--- 埋点 3
      const data = await res.json()
      console.log("📦 [前端] 拿到后端数据:", data) // <--- 埋点 4：最关键！看这里有没有 messages 数组
      if (data.messages) {
        setMessages(data.messages)
        console.log("✅ [前端] 状态已更新，应该显示消息了，数量:", data.messages.length) // <--- 埋点 5
      }
    } catch (e) {
      console.error("获取消息失败:", e)
    }
  }

  // 2. 自动轮询 (每 3 秒刷新一次，实现“伪实时”两边同步)
  useEffect(() => {
    if (isOpen) {
      fetchMessages() // 打开时先查一次
      const timer = setInterval(fetchMessages, 3000) // 每3秒查一次
      return () => clearInterval(timer)
    }
  }, [isOpen, orderId])

  // 3. 消息更新后自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      const { scrollHeight, clientHeight } = messagesEndRef.current
      // 直接修改容器的 scrollTop，绝不会影响外层页面
      messagesEndRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth"
      })
    }
  }, [messages])

  // 4. 发送消息的方法
  const sendMessage = async () => {
    if (!input.trim()) return
    setSending(true)

    // 1. 乐观更新：先假装成功，让用户看到消息上屏
    const tempMessage = {
      id: "temp-" + Date.now(),
      content: input,
      sender_type: "customer",
      created_at: new Date().toISOString()
    }
    // 强制把新消息加到列表里
    setMessages((prev) => [...prev, tempMessage])
    
    const msgToSend = input
    setInput("") // 清空输入框

    try {
      console.log("准备发送:", msgToSend) // Debug 1

      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // 这里的 Key 如果有的话带上，没有也没事，因为 route.ts 改过了
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" 
        },
        body: JSON.stringify({
          order_id: orderId,
          content: msgToSend,
          sender_type: "customer",
        }),
      })

      // Debug 2: 打印状态码
      console.log("发送请求状态码:", res.status)

      if (!res.ok) {
        // 如果状态码不是 2xx，打印错误文本
        const errText = await res.text()
        console.error("服务器报错:", errText)
        throw new Error(`发送失败: ${res.status}`)
      }

      // 🔴 关键修复：不要盲目 await res.json()
      // 如果后端没返回 JSON，这里会报错导致跳到 catch
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        console.log("发送成功，后端返回:", data)
      } catch (e) {
        console.warn("后端返回的不是标准 JSON，但状态码是 200，视为成功。", text)
      }

      // 发送成功后，重新拉取最新数据（以修正 ID 和时间）
      await fetchMessages()

    } catch (e) {
      console.error("捕获到错误:", e)
      // 如果乐观更新失败了，这里其实可以回滚（把刚才那个 temp 删掉）
      // alert("发送失败，请查看控制台") 
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-xl font-semibold mb-4">联系客服</h3>
      
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)}>发起咨询</Button>
      ) : (
        <div className="border rounded-lg p-4 max-w-md bg-gray-50 shadow-sm">
           {/* 聊天记录区域 */}
           <div className="h-80 overflow-y-auto mb-4 flex flex-col gap-3 p-2 bg-white border rounded" ref={messagesEndRef}>
             {messages.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">暂无消息，请留言</div>}
             
             {messages.map((m) => (
               <div 
                 key={m.id} 
                 className={`max-w-[80%] p-3 rounded-lg text-sm ${
                   m.sender_type === 'customer' 
                     ? 'bg-blue-600 text-white self-end rounded-br-none' // 顾客靠右，蓝色
                     : 'bg-gray-200 text-gray-800 self-start rounded-bl-none' // 客服靠左，灰色
                 }`}
               >
                 <div>{m.content}</div>
                 {/* 显示时间 (可选) */}
                 <div className={`text-[10px] mt-1 ${m.sender_type === 'customer' ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </div>
               </div>
             ))}
             {/* 滚动锚点 */}
           </div>
           
           {/* 输入区域 */}
           <div className="flex gap-2">
             <input 
               className="flex-1 border p-2 rounded focus:outline-blue-500"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()} // 支持回车发送
               placeholder="请输入您的问题..."
               disabled={sending}
             />
             <Button 
               onClick={sendMessage} 
               isLoading={sending}
               disabled={sending || !input.trim()}
             >
               发送
             </Button>
           </div>
        </div>
      )}
    </div>
  )
}