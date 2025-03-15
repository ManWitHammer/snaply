import express from 'express'
import cookieParser from "cookie-parser"
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import router from './router/router'
import errorMiddleware from "./middlewares/error-middleware"
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
    origin: "http://localhost:8081",
    credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/api', router)
app.use(errorMiddleware)

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Превышено количество запросов. Подождите не меньше минуты' },
}))

const start = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/auth')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (e) {
    console.log(e)
  }
}

start()