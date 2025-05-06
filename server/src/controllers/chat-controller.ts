import { Request, Response, NextFunction } from 'express';
import ChatService from '../services/chat-service'
import { deleteUploadedFiles } from '../middlewares/multer-middleware'

class ChatController {
    async getChats(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const chats = await ChatService.getChats(authHeader);
            res.json(chats)
        } catch (error) {
            next(error)
        }
    }
    async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { chatId } = req.params
            const { page = 1 } = req.query
            const chats = await ChatService.getMessages(authHeader, chatId, +page)
            res.json(chats)
        } catch (error) {
            next(error)
        }
    }
    async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { chatId } = req.params
            const image = req.file ? req.file.path : ""
            const { message, replyTo, forwardedFromUser, forwardedFromPost } = req.body
    
            const chats = await ChatService.sendMessage(
                authHeader,
                chatId,
                message,
                image,
                replyTo,
                forwardedFromUser,
                forwardedFromPost
            )
    
            if (image) deleteUploadedFiles(req)
    
            res.json(chats)
        } catch (error) {
            next(error)
        }
    }
    async editMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { chatId, messageId } = req.params
            const { message } = req.body
            const result = await ChatService.editMessage(authHeader, chatId, messageId, message)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
    async deleteMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { chatId, messageId } = req.params
            const result = await ChatService.deleteMessage(authHeader, chatId, messageId)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
}

export default new ChatController()