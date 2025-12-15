import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PostsGateway } from './posts.gateway';

@Processor('post-processing') // 👈 Queue ka naam same hona chahiye!
export class PostsProcessor extends WorkerHost {
  
  // 👇 Gateway Inject karein
  constructor(private postsGateway: PostsGateway) {
    super();
  }
  // Yeh function automatic call hoga jab queue mein naya kaam aayega
  async process(job: Job<any, any, string>): Promise<any> {
    
    console.log(`👨‍🍳 Worker Started: Processing Post ${job.data.title} (ID: ${job.id})`);

    // 🕒 Simulation: Hum dikhayenge ki kaam mein 5 second lag rahe hain
    // (Real life mein yahan Image Resizing ya Video encoding hoti)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Jab kaam khatam ho jaye
    console.log(`✅ Worker Finished: Post ${job.data.title} is ready!`);
    // 👇 EVENT TRIGGER KAREIN
    // Hum wahi data bhej rahe hain jo Frontend ko chahiye
    this.postsGateway.notifyPostCreated(job.data);
    return {};
  }
}