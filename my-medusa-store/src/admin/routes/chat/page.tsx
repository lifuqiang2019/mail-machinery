import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Container, Heading, Text, Input, Button, clx, Avatar } from "@medusajs/ui"
import { useState, useEffect, useRef } from "react"
import io, { Socket } from "socket.io-client"

const ChatPage = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  // 1. 初始化 Socket
  useEffect(() => {
    const newSocket = io("http://localhost:7002")
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("✅ Admin connected to socket")
      newSocket.emit("join_room", "admin")
    })

    newSocket.on("receive_message", (msg) => {
      console.log("📩 Admin received message:", msg)
      
      // 1. 如果是当前选中用户的消息，追加到右侧消息列表
      if (msg.user_id === selectedUser) {
        setMessages((prev) => {
          // 简单的防抖，防止同一条消息瞬间重复添加
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
      
      // 2. 无论是不是当前用户，都更新左侧会话列表
      updateConversationList(msg)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [selectedUser]) // selectedUser 变化时，receive_message 闭包更新

  // 2. 获取会话列表 (只在加载时执行一次)
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch("/admin/chat/conversations")
      const data = await res.json()
      console.log("📜 Admin Conversations:", data)
      setConversations(data.conversations || [])
    } catch (e) {
      console.error("Failed to fetch conversations", e)
    }
  }

  // 3. 选中用户，获取历史消息
  useEffect(() => {
    if (!selectedUser) return
    console.log("🖱️ Selected user changed:", selectedUser)
    fetchMessages(selectedUser)
  }, [selectedUser])

  const fetchMessages = async (userId: string) => {
    try {
      console.log("📥 Fetching messages for:", userId)
      const res = await fetch(`/admin/chat/messages?user_id=${userId}`)
      const data = await res.json()
      console.log("📦 Fetched messages count:", data.messages?.length)
      setMessages(data.messages || [])
    } catch (e) {
      console.error("Failed to fetch messages", e)
    }
  }

  const updateConversationList = (msg: any) => {
    setConversations((prev) => {
      const currentList = prev || []
      const index = currentList.findIndex((c) => c.user_id === msg.user_id)
      const newList = [...currentList]
      
      if (index > -1) {
        // 如果会话已存在，更新它并移到最前
        // 保留原有的 user_id 等信息，只更新 last_message
        const updatedConv = { ...newList[index], last_message: msg }
        newList.splice(index, 1)
        newList.unshift(updatedConv)
      } else {
        // 如果是新会话，插入到最前
        // 注意：这里我们手动构造一个会话对象
        const newConv = { 
          user_id: msg.user_id, 
          last_message: msg, 
          unread_count: 1 
        }
        newList.unshift(newConv)
      }
      return newList
    })
  }

  const handleSend = () => {
    if (!inputValue.trim() || !socket || !selectedUser) return

    // 构造新消息
    const msg = {
      id: "temp-" + Date.now(), // 临时 ID，防止 key warning
      room_id: selectedUser, 
      user_id: selectedUser, 
      sender_type: "admin",
      content: inputValue,
      created_at: new Date().toISOString(),
      metadata: { customer_name: "Admin" } // 可选
    }

    // 乐观更新：立即显示在右侧
    setMessages((prev) => [...prev, msg])
    setInputValue("")

    // 发送给 Socket
    socket.emit("send_message", msg)
    
    // 同时更新左侧会话列表（让自己也能看到最新消息摘要）
    updateConversationList(msg)
  }

  // 滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 格式化时间
  const formatTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    return date.toLocaleTimeString()
  }

  // 查找当前选中用户的显示名称
  const getCurrentUserName = () => {
    if (!selectedUser) return ""
    
    const msgWithMeta = messages.find(m => m.metadata?.customer_name)
    if (msgWithMeta) return msgWithMeta.metadata.customer_name

    const conv = conversations.find(c => c.user_id === selectedUser)
    if (conv?.last_message?.metadata?.customer_name) return conv.last_message.metadata.customer_name

    return selectedUser
  }

  return (
    <Container className="p-0 h-[calc(100vh-100px)] flex overflow-hidden">
      {/* 左侧列表 */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <Heading level="h2">客服消息</Heading>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const displayName = conv.last_message?.metadata?.customer_name 
              ? conv.last_message.metadata.customer_name 
              : `User: ${conv.user_id.slice(0, 8)}...`
              
            return (
              <div
                key={conv.user_id}
                onClick={() => setSelectedUser(conv.user_id)}
                className={clx(
                  "p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors",
                  selectedUser === conv.user_id && "bg-white border-l-4 border-l-blue-500"
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <Text className="font-medium truncate w-2/3" size="small">
                    {displayName}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {formatTime(conv.last_message?.created_at)}
                  </Text>
                </div>
                <Text className="text-gray-500 truncate text-small-regular">
                  {conv.last_message?.content}
                </Text>
              </div>
            )
          })}
        </div>
      </div>

      {/* 右侧聊天窗 */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <Heading level="h3">
                正在与 {getCurrentUserName()} 对话
              </Heading>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => {
                const isAdmin = msg.sender_type === "admin"
                return (
                  <div key={idx} className={clx("flex", isAdmin ? "justify-end" : "justify-start")}>
                     <div className={clx(
                       "max-w-[70%] rounded-lg p-3 shadow-sm",
                       isAdmin ? "bg-blue-600 text-white" : "bg-white border"
                     )}>
                       {msg.metadata && msg.metadata.title && (
                         <div className="mb-2 p-2 bg-black/10 rounded text-xs">
                            {msg.metadata.title && <div className="font-bold">{msg.metadata.title}</div>}
                            {msg.metadata.price && <div>{msg.metadata.price}</div>}
                         </div>
                       )}
                       <Text className="text-sm">{msg.content}</Text>
                       <Text className={clx("text-[10px] mt-1 text-right", isAdmin ? "text-blue-200" : "text-gray-400")}>
                         {formatTime(msg.created_at)}
                       </Text>
                     </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t bg-white flex gap-2 h-20 items-center">
              <div className="flex-1">
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="输入回复..." 
                  className="w-full"
                />
              </div>
              <Button variant="primary" onClick={handleSend}>发送</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <ChatBubbleLeftRight className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <Text>请选择一个会话开始聊天</Text>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Chat",
  icon: ChatBubbleLeftRight,
})

export default ChatPage
