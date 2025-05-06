import tokenService from './token-service'
import { ChatModel } from '../models/chat-model'
import { UserModel } from '../models/user-model'
import { PostModel } from '../models/post-model'
import { ApiError } from '../exceptions/api-error'
import SocketService from './socket-service'
import fs from "fs"
import { Types } from 'mongoose'
import Cassiopeia from './cassiopeia-service'

interface IUser {
    _id: Types.ObjectId
    name: string
    surname: string
    avatar: string
    status: string
}

class ChatService {
    async getChats(authHeader: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
            
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
        
        const user = await UserModel.findOne({ email: userData.email })
        
        if (!user) throw ApiError.UnauthorizedError()

        const userId = user._id as Types.ObjectId

        const chats = await ChatModel.find({ participants: userId })
            .populate('participants', 'avatar name surname')
            .populate('messages.sender', '_id')

        const formattedChats = chats.map(chat => {
            const otherParticipant = chat.participants.find(
                (p: any) => p._id.toString() !== userId.toString()
            )
            const lastMessage = chat.messages[chat.messages.length - 1]
                

            return {
                chatId: chat._id,
                participant: otherParticipant ? {
                    avatar: (otherParticipant as unknown as IUser).avatar,
                    name: (otherParticipant as unknown as IUser).name,
                    surname: (otherParticipant as unknown as IUser).surname
                } : null,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    isOwnMessage: lastMessage.sender._id.toString() === userId.toString(),
                    timestamp: lastMessage.timestamp
                } : null,
                isGroup: chat.isGroup
            }
        })

        return formattedChats
    }   
    async getMessages(authHeader: string, chatId: string, page: number) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
        
        const user = await UserModel.findOne({ email: userData.email })
        if (!user) throw ApiError.UnauthorizedError()
    
        const perPage = 50;
        const userId = user._id as Types.ObjectId;
            
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId
        }).populate('participants', 'avatar name surname status')
            
        if (!chat) {
            throw ApiError.BadRequest('Вы не являетесь участником этого чата');
        }
            
        const otherParticipant = chat.participants.find(
            (p: any) => p._id.toString() !== userId.toString()
        )
            
            // Получаем общее количество сообщений
        const totalMessages = await ChatModel.aggregate([
            { $match: { _id: new Types.ObjectId(chatId) } },
            { $project: { count: { $size: "$messages" } } }
        ]);
            
        const totalCount = totalMessages[0]?.count || 0;
            
            // Вычисляем старт и лимит
        const startIndex = totalCount - (page * perPage); // откуда начинать
        const sliceStart = Math.max(startIndex, 0);
        const sliceLimit = startIndex < 0 ? perPage + startIndex : perPage;
            
        if (sliceLimit <= 0) {
                // Если сообщений больше нет — возвращаем пусто
            return {
                messages: [],
                hasMore: false,
                otherParticipant: otherParticipant ? {
                    _id: (otherParticipant as unknown as IUser)._id,
                    avatar: (otherParticipant as unknown as IUser).avatar,
                    name: (otherParticipant as unknown as IUser).name,
                    surname: (otherParticipant as unknown as IUser).surname,
                    status: (otherParticipant as unknown as IUser).status
                } : null
            }
        }
            
        const chatWithMessages = await ChatModel.findOne(
            { _id: chatId },
            { messages: { $slice: [sliceStart, sliceLimit] } }
        )
            .populate('messages.sender', 'name surname avatar')
            .populate({
                path: 'messages.forwardedFromPost',
                select: 'images',
                populate: {
                    path: 'author',
                    select: 'name surname avatar'
                }
            })
            .populate('messages.forwardedFromUser', 'name surname avatar')

        if (!chatWithMessages) throw ApiError.BadRequest('Чат не найден');
          
        const hasMore = sliceStart > 0
            
        return {
            messages: chatWithMessages.messages.reverse(),
            hasMore,
            otherParticipant: otherParticipant ? {
                _id: (otherParticipant as unknown as IUser)._id,
                avatar: (otherParticipant as unknown as IUser).avatar,
                name: (otherParticipant as unknown as IUser).name,
                surname: (otherParticipant as unknown as IUser).surname,
                status: (otherParticipant as unknown as IUser).status
            } : null
        }
    }
    
    async sendMessage(authHeader: string, chatId: string, message: string | null, image: string | null, replyTo?: string, forwardedFromUser?: string, forwardedFromPost?: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
    
        const userData = await tokenService.validateRefreshToken(authHeader)
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
    
        const user = await UserModel.findOne({ email: userData.email })
        if (!user) throw ApiError.UnauthorizedError()
    
        const userId = user._id as Types.ObjectId
    
        if (!message && !image) throw ApiError.BadRequest('Сообщение не может быть пустым')
    
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId
        }).populate('participants', 'avatar name surname')
    
        if (!chat) throw ApiError.BadRequest('Вы не являетесь участником этого чата')
    
        let imageUrl = null
        if (image) {
            await Cassiopeia.updateTokens()
            const buffer = fs.readFileSync(image)
            const fileName = image.split('\\').pop()
            if (!fileName) throw ApiError.UnauthorizedError()
    
            const result = await Cassiopeia.upload(buffer, fileName, true)
            if (!result || typeof result !== 'object' || !('uuid' in result)) {
                throw ApiError.UnauthorizedError()
            }
    
            imageUrl = `https://cassiopeia-database-195be7295ffe.herokuapp.com/api/v1/files/public/${result.uuid}?${result.blurhash}`
        }
    
        if (forwardedFromUser) {
            const forwardedUserExists = await UserModel.exists({ _id: forwardedFromUser })
            if (!forwardedUserExists) throw ApiError.BadRequest('Пересылаемый пользователь не найден')
        }
    
        if (forwardedFromPost) {
            const forwardedPostExists = await PostModel.exists({ _id: forwardedFromPost })
            if (!forwardedPostExists) throw ApiError.BadRequest('Пересылаемый пост не найден')
        }
    
        if (replyTo && !chat.messages.find(m => (m._id as Types.ObjectId).toString() === replyTo)) {
            throw ApiError.BadRequest('Сообщение для ответа не найдено')
        }
    
        const userMessage: any = {
            sender: userId,
            content: message || '',
            image: imageUrl,
            timestamp: new Date(),
            ...(forwardedFromUser && { forwardedFromUser }),
            ...(forwardedFromPost && { forwardedFromPost }),
            ...(replyTo && { replyTo }),
        }
    
        const newChat = await ChatModel.findByIdAndUpdate(
            chatId,
            { $push: { messages: userMessage } },
            { new: true }
        )
    
        if (!newChat) throw ApiError.BadRequest('Чат не найден')
    
        const otherParticipant = chat.participants.find(
            (p: any) => p._id.toString() !== userId.toString()
        )
        if (!otherParticipant) throw ApiError.BadRequest('Что-то пошло не по плану')
    
        const lastMessage = await ChatModel.findOne(
            { _id: chatId, 'messages._id': newChat.messages[newChat.messages.length - 1]._id },
            { 'messages.$': 1 }
        )
        .populate('messages.sender', 'name surname avatar')
        .populate({
            path: 'messages.forwardedFromPost',
            select: 'images',
            populate: {
                path: 'author',
                select: 'name surname avatar'
            }
        })
        .then(chat => chat?.messages[0])
        console.log(lastMessage)
        if (!lastMessage) throw ApiError.BadRequest('Что-то пошло не по плану')
        await SocketService.notifyNewMessage(userId.toString(), otherParticipant._id.toString(), lastMessage, chatId)
    
        return lastMessage
    }
    
    async editMessage(authHeader: string, chatId: string, messageId: string, message: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()

        const userData = await tokenService.validateRefreshToken(authHeader)
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }

        const user = await UserModel.findOne({ email: userData.email })
        if (!user) throw ApiError.UnauthorizedError()

        const userId = user._id as Types.ObjectId

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            'messages._id': messageId,
            'messages.sender': userId
        })

        if (!chat) {
            throw ApiError.BadRequest('Сообщение не найдено или у вас нет прав на его редактирование')
        }

        const updatedChat = await ChatModel.findOneAndUpdate(
            { _id: chatId, 'messages._id': messageId },
            { $set: { 'messages.$.content': message, 'messages.$.isEdited': true } },
            { new: true }
        )

        const otherParticipant = chat.participants.find(
            (p: any) => p._id.toString() !== userId.toString()
        )

        if (!otherParticipant) throw ApiError.BadRequest('Что-то пошло не по плану')

        await SocketService.notifyMessageEdited(userId.toString(), otherParticipant._id.toString(), messageId, message, chatId)

        return updatedChat
    }

    async deleteMessage(authHeader: string, chatId: string, messageId: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()

        const userData = await tokenService.validateRefreshToken(authHeader)
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }

        const user = await UserModel.findOne({ email: userData.email })
        if (!user) throw ApiError.UnauthorizedError()

        const userId = user._id as Types.ObjectId

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            'messages._id': messageId,
            'messages.sender': userId
        })

        if (!chat) {
            throw ApiError.BadRequest('Сообщение не найдено или у вас нет прав на его удаление')
        }

        const updatedChat = await ChatModel.findOneAndUpdate(
            { _id: chatId },
            { $pull: { messages: { _id: messageId } } },
            { new: true }
        )

        const otherParticipant = chat.participants.find(
            (p: any) => p._id.toString() !== userId.toString()
        )

        if (!otherParticipant) throw ApiError.BadRequest('Что-то пошло не по плану')

        await SocketService.notifyMessageDeleted(userId.toString(), otherParticipant._id.toString(), messageId, chatId)

        return updatedChat
    }
}

export default new ChatService()