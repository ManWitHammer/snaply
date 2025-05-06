import { Socket, Server } from 'socket.io';
import { UserModel } from '../models/user-model';
import { ChatModel, IMessage } from '../models/chat-model';
import { ApiError } from '../exceptions/api-error'
import tokenService from './token-service'
import UserDto from '../dto/user-dto';

class SocketService {
    private static io: Server | null = null;

    static async verifyToken(socket: Socket): Promise<{userId: string, user: any} | null> {
        try {
            const authToken = socket.handshake.auth.token;
            if (!authToken) throw ApiError.UnauthorizedError();
            
            const userData = await tokenService.validateRefreshToken(authToken);
            if (typeof userData !== 'object' || !userData || !('email' in userData)) {
                throw ApiError.UnauthorizedError();
            }
            
            const user = await UserModel.findOne({ email: userData.email });
            if (!user) throw ApiError.UnauthorizedError();
            
            return { userId: user._id as string, user };
        } catch (error) {
            console.error('Token verification error:', error);
            socket.disconnect();
            return null;
        }
    }

    static setIoInstance(io: Server) {
        SocketService.io = io;
    }

    static async onConnection(socket: Socket) {
        const auth = await this.verifyToken(socket);
        if (!auth) return;

        await UserModel.findByIdAndUpdate(auth.userId, { 
            status: 'online',
            lastLogin: new Date(),
            socketId: socket.id
        });

        console.log(`User ${auth.userId} connected`);
        socket.data.userId = auth.userId;
    }

    static async onDisconnect(socket: Socket) {
        if (!socket.data.userId) return;
        
        await UserModel.findByIdAndUpdate(socket.data.userId, { 
            status: 'offline',
            lastLogin: new Date(),
            socketId: null
        });
        console.log(`User ${socket.data.userId} disconnected`);
    }

    private static async getSocketId(userId: string): Promise<string | null> {
        const user = await UserModel.findById(userId, 'socketId');
        return user?.socketId || null;
    }

    static async notifyAccountActivation(userId: string): Promise<void> {
        const user = await UserModel.findById(userId)
        if (!user) throw ApiError.UnauthorizedError()

        const userDto = new UserDto(user)

        try {
            const socketId = await this.getSocketId(userId);
            if (socketId && this.io) {
                this.io.to(socketId).emit('accountActivated', {
                    userDto,
                    timestamp: new Date(),
                    message: 'Ваш аккаунт успешно активирован'
                });
            }
        } catch (error) {
            console.error('Account activation notification error:', error);
        }
    }

    static async notifyNewFriendRequest(senderId: string, recipientId: string) {
        try {
            const recipientSocketId = await this.getSocketId(recipientId)
            const user = await UserModel.findById(senderId)
            if (!user) throw ApiError.UnauthorizedError()

            const userDto = new UserDto(user)

            if (recipientSocketId && this.io) {
                this.io.to(recipientSocketId).emit('newFriendRequest', {
                    from: senderId,
                    userDto,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    }
    
    static async notifyFriendRequestAccepted(acceptorId: string, requesterId: string) {
        try {
            const requesterSocketId = await this.getSocketId(requesterId)
            const user = await UserModel.findById(acceptorId)
            if (!user) throw ApiError.UnauthorizedError()

            const userDto = new UserDto(user)
            if (requesterSocketId && this.io) {
                this.io.to(requesterSocketId).emit('friendRequestAccepted', {
                    by: acceptorId,
                    userDto,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    }
    
    static async notifyFriendRequestRejected(rejectorId: string, requesterId: string) {
        try {
            const requesterSocketId = await this.getSocketId(requesterId)
            const user = await UserModel.findById(rejectorId)
            if (!user) throw ApiError.UnauthorizedError()

            const userDto = new UserDto(user)
            if (requesterSocketId && this.io) {
                this.io.to(requesterSocketId).emit('friendRequestRejected', {
                    by: rejectorId,
                    userDto,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    static async notifyNewMessage(senderId: string, recipientId: string, message: IMessage, chatId: string) {
        try {
          const recipientSocketId = await this.getSocketId(recipientId);
          const user = await UserModel.findById(senderId);
          if (!user) throw ApiError.UnauthorizedError();
      
          const userDto = {
            _id: user._id as string,
            name: user.name,
            surname: user.surname,
            avatar: user.avatar
          };
      
          if (recipientSocketId && this.io) {
            console.log('Sending notification to recipient:', recipientSocketId);
            this.io.to(recipientSocketId).emit('newMessage', {
              from: senderId,
              userDto,
              message,
              chatId
            });
        }
        } catch (error) {
          console.error('Notification error:', error);
        }
    }

    static async notifyMessageEdited(senderId: string, recipientId: string, messageId: string, newMessage: string, chatId: string) {
        try {
            const recipientSocketId = await this.getSocketId(recipientId)
            const user = await UserModel.findById(senderId)
            if (!user) throw ApiError.UnauthorizedError()

            const userDto = new UserDto(user)
            if (recipientSocketId && this.io) {
                this.io.to(recipientSocketId).emit('messageEdited', {
                    from: senderId,
                    userDto,
                    messageId,
                    newMessage,
                    chatId,
                    timestamp: new Date(Date.now()).toISOString()
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    static async notifyMessageDeleted(senderId: string, recipientId: string, messageId: string, chatId: string) {
        try {
            const recipientSocketId = await this.getSocketId(recipientId)
            const user = await UserModel.findById(senderId)
            if (!user) throw ApiError.UnauthorizedError()

            const userDto = new UserDto(user)
            if (recipientSocketId && this.io) {
                console.log('Sending notification to recipient:', recipientSocketId)
                this.io.to(recipientSocketId).emit('messageDeleted', {
                    from: senderId,
                    userDto,
                    messageId,
                    chatId,
                    timestamp: new Date(Date.now()).toISOString()
                });
            }
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    static async notifyFriendDeleted(senderId: string, requesterId: string) {
        try {
            const requesterSocketId = await this.getSocketId(requesterId)
            const user = await UserModel.findById(senderId)
            if (!user) throw ApiError.UnauthorizedError()

            const userDto = new UserDto(user)
            if (requesterSocketId && this.io) {
                this.io.to(requesterSocketId).emit('friendDeleted', {
                    by: senderId,
                    userDto,
                    timestamp: new Date(Date.now()).toISOString()
                });
            }
        } catch(err) {
            console.error('Notification error:', err);
        }
    }

    static async onTyping(socket: Socket, chatId: string) {
        const auth = await this.verifyToken(socket);
        if (!auth) return;

        const chat = await ChatModel.findById(chatId)
        if (!chat) return;

        const friendId = chat.participants.find(id => id.toString() !== auth.userId)
        if (!friendId) return;

        try {
            const socketId = await this.getSocketId(friendId.toString());
            if (socketId && this.io) {
                this.io.to(socketId).emit('onTyping', {
                    senderId: auth.userId,
                    receiverId: friendId,
                    chatId
                });
            }
        } catch (error) {
            console.error('Account activation notification error:', error);
        }
    }

    static async onStopTyping(socket: Socket, chatId: string) {
        const auth = await this.verifyToken(socket);
        if (!auth) return;

        const chat = await ChatModel.findById(chatId)
        if (!chat) return;

        const friendId = chat.participants.find(id => id.toString() !== auth.userId)
        if (!friendId) return;

        try {
            const socketId = await this.getSocketId(friendId.toString());
            if (socketId && this.io) {
                this.io.to(socketId).emit('onStopTyping', {
                    senderId: auth.userId,
                    receiverId: friendId,
                    chatId
                });
            }
        } catch (error) {
            console.error('Account activation notification error:', error);
        }
    }
}

export default SocketService;