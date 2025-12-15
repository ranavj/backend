import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Production mein isse frontend URL par lock karein
  },
})
export class PostsGateway {
  @WebSocketServer()
  server: Server;

  // Yeh function hum Worker se call karenge
  notifyPostCreated(post: any) {
    // 'post-ready' event ka naam hai
    this.server.emit('post-ready', post);
    console.log(`📢 Notification Sent: Post "${post.title}" is ready!`);
  }
}