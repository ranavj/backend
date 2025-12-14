import { Inject, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './entities/post.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // 👈 Cache Manager Inject kiya
  ) {}

  async create(createPostDto: CreatePostDto, userId: string) {
    // Post create karte waqt User ID bhi save karein
    const newPost = new this.postModel({
      ...createPostDto,
      authorId: userId,
    });

    // 🧹 CACHE INVALIDATION:
    // Jab nayi post aaye, toh purana cache delete kar do,
    // taaki user ko naya data dikhe.
    await this.cacheManager.del('feed_posts');
    return newPost.save();
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
      .exec();

    // 3. Save to Cache
    await (this.cacheManager as any).set(cacheKey, posts, 60000);

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
