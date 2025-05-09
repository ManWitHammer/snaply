import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import SocketService from '../services/socket-service';
import 'dotenv/config';

const CLIENT_URL = process.env.CLIENT_URL || '*';

class SocketController {
    private io: Server | null = null;

    init(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: CLIENT_URL,
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        SocketService.setIoInstance(this.io);

        this.io.on("connection", (socket: Socket) => {
            console.log(`Client connected: ${socket.id}`);

            SocketService.onConnection(socket);

            socket.on("disconnect", () => {
                SocketService.onDisconnect(socket);
            });

            socket.on('typing', ({ chatId, userId }: { chatId: string, userId: string }) => {
                SocketService.onTyping(socket, chatId);
                console.log(`User ${userId} is typing in chat ${chatId}`);
            });
          
            socket.on('stopTyping', ({ chatId, userId }: { chatId: string, userId: string }) => {
                SocketService.onStopTyping(socket, chatId);
                console.log(`User ${userId} stopped typing in chat ${chatId}`);
            });
        });
    }
}

export default new SocketController();