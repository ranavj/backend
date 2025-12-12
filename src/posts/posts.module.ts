import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './entities/post.entity';
import { PostsResolver } from './posts.resolver';
import { UsersModule } from 'src/users/users.module';
import { CloudinaryProvider } from 'src/cloudinary.provider';
import { CloudinaryService } from 'src/cloudinary.service';

@Module({
  imports:[
    // MongoDB Collection 'posts' naam se banega
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    UsersModule, // 👈 Add here
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsResolver, CloudinaryProvider, CloudinaryService],
})
export class PostsModule {}
