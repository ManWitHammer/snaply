import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import { createServer } from 'http'
import SocketController from './controllers/socket-controller'
import router from './router/router'
import errorMiddleware from "./middlewares/error-middleware"
import rateLimit from 'express-rate-limit'
import 'dotenv/config'

const app = express()

const server = createServer(app)

const CLIENT_URL = process.env.CLIENT_URL || ''
const MONGO_URI = process.env.MONGODB_URI || ''
const PORT = process.env.PORT || 3000

app.use('/uploads', express.static('uploads'))
app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
  	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}))
app.use(bodyParser.json())
app.use('/api', router)
app.use(errorMiddleware)

app.use(rateLimit({
  windowMs: 0.5 * 60 * 1000,
  max: 15,
  message: { message: 'Превышено количество запросов. Подождите не меньше минуты' },
}))

SocketController.init(server)

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (e) {
    console.log(e)
  }
}

start()