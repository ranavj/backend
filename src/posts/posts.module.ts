import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './entities/post.entity';
import { PostsResolver } from './posts.resolver';
import { UsersModule } from 'src/users/users.module';
import { CloudinaryProvider } from 'src/cloudinary.provider';
import { CloudinaryService } from 'src/cloudinary.service';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { PostsProcessor } from './posts.processor';
import { PostsGateway } from './posts.gateway';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports:[
    // MongoDB Collection 'posts' naam se banega
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    UsersModule, // 👈 Add here
    // 👇 2. Specific Queue Register Karein
    BullModule.registerQueue({
      name: 'post-processing', // Is queue ka naam yaad rakhna!
    }),
    BullBoardModule.forFeature({
      name: 'post-processing',
      adapter: BullMQAdapter, 
    }),
    SearchModule
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsResolver, CloudinaryProvider, CloudinaryService, PostsProcessor, PostsGateway],
  exports: [BullModule]
})
export class PostsModule {}
