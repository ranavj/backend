import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './entities/post.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // 👈 Cache Manager Inject kiya
    // 👇 QUEUE INJECT KAREIN
    @InjectQueue('post-processing') private postQueue: Queue
  ) { }

  async create(createPostDto: CreatePostDto, userId: string) {
    // 1. Save to MongoDB
    const newPost = new this.postModel({
      ...createPostDto,
      authorId: userId,
    });
    const savedPost = await newPost.save();

    // 👇 FIX: Document ko Plain Object mein convert karein
    // Isse saare Mongoose ke hidden methods hat jayenge aur clean data milega
    const postData = savedPost.toObject(); 

    // 2. Add to Queue (Ab 'postData' use karein)
    await this.postQueue.add('heavy-task', {
      postId: postData._id,
      title: postData.title, // 👈 Ab yeh undefined nahi hoga
      authorId: userId
    });

    // Log mein bhi 'postData.title' use karein
    console.log(`📨 Job added to queue for Post: ${postData.title}`);

    // 3. Cache Clear
    try {
        await this.cacheManager.del('feed_posts_0_10');
    } catch (e) {}

    return postData;
  }

  // 👇 Update findAll to accept arguments
  async findAll(skip: number = 0, limit: number = 10) {
    const cacheKey = `feed_posts_${skip}_${limit}`; // Cache key unique honi chahiye

    // 1. Check Cache
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ Using Cached Data (${skip}-${limit})`);
      return cachedData;
    }

    console.log(`🐢 Fetching from MongoDB (Skip: ${skip}, Limit: ${limit})`);

    // 2. MongoDB Query with Skip & Limit
    const posts = await this.postModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)   // 👈 Kitne posts skip karein
      .limit(limit) // 👈 Kitne posts layein
      .lean() // 👈 YEH ADD KAREIN (Document ko Plain JSON banata hai)
      .exec();

    // 3. Save to Cache (Debug log add kiya hai)
    try {
      // Note: 'ttl' milliseconds mein hota hai recent versions mein (60000 = 60s)
      await this.cacheManager.set(cacheKey, posts, 60000);
      console.log(`💾 Saved to Redis: ${cacheKey}`);
    } catch (error) {
      console.error("❌ Redis Save Error:", error);
    }
    return posts;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
