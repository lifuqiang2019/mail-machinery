import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/chat", // 匹配 /chat 路由
      // 🔴 关键修改 1：删掉了 method: "OPTIONS"，让它对 GET/POST 也生效
      middlewares: [
        (req, res, next) => {
          // 1. 获取来源
          const origin = req.headers.origin || "*"

          // 2. 给所有进来的请求都贴上“允许跨域”的标签
          res.setHeader("Access-Control-Allow-Origin", origin)
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key")
          res.setHeader("Access-Control-Allow-Credentials", "true")

          // 3. 分流处理
          if (req.method === "OPTIONS") {
            // 如果是预检请求，直接结束，不往下走了
            res.status(200).end()
            return
          }

          // 🔴 关键修改 2：如果是 GET/POST，贴完标签后，继续往下走去执行 route.ts
          next()
        },
      ],
    },
  ],
})