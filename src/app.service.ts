import { Injectable } from '@nestjs/common';
import * as os from 'os'; // OS module import karein
@Injectable()
export class AppService {
  getHello(): string {
    // Har container ka hostname alag hota hai (Random ID)
    const serverId = os.hostname(); 
    return `Hello from Server ID: ${serverId} 🚀`;
  }
}
