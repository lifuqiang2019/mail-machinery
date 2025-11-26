import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/chat/*", 
      middlewares: [
        (req, res, next) => {
          const origin = req.headers.origin || "*"
          res.setHeader("Access-Control-Allow-Origin", origin)
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
          res.setHeader("Access-Control-Allow-Credentials", "true")
          
          if (req.method === "OPTIONS") {
            res.status(204).end()
            return
          }
          next()
        }
      ]
    },
    {
      matcher: "/admin/chat/*", 
      middlewares: [
        (req, res, next) => {
          const origin = req.headers.origin || "*"
          res.setHeader("Access-Control-Allow-Origin", origin)
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
          res.setHeader("Access-Control-Allow-Credentials", "true")
          
          if (req.method === "OPTIONS") {
            res.status(204).end()
            return
          }
          next()
        }
      ]
    }
  ],
})
