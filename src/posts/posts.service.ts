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
import { SearchService } from 'src/search/search.service';
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // 👈 Cache Manager Inject kiya
    // 👇 QUEUE INJECT KAREIN
    @InjectQueue('post-processing') private postQueue: Queue,
    private searchService: SearchService //  Inject
  ) { }

  async create(createPostDto: CreatePostDto, userId: string) {
    // 1. Save to MongoDB
    const newPost = new this.postModel({
      ...createPostDto,
      authorId: userId,
      createdAt: new Date(), // Date ensure karein
    });
    const savedPost = await newPost.save();

    // Plain Object Conversion (Mongoose magic hatane ke liye)
    const postData = savedPost.toObject();

    // 👇 2. Sync with Elasticsearch (NAYA STEP)
    // Hum isse 'await' kar rahe hain taaki agar search index fail ho toh pata chale
    // (Aap chahein toh isse bina await ke bhi chhod sakte hain speed ke liye)
    try {
      await this.searchService.indexPost(postData);
      console.log(`🔍 Post Indexed to Elastic: ${postData.title}`);
    } catch (error) {
      console.error('❌ Elasticsearch Indexing Failed:', error);
      // Fail hone par hum process nahi rokenge, bas log karenge
    }

    // 3. Add to Queue (Heavy Processing)
    await this.postQueue.add('post-job', { // Job name match karein ('heavy-task' ya 'post-job')
      postId: postData._id,
      title: postData.title,
      authorId: userId,
      // content: postData.content // Agar worker ko content chahiye
    });

    console.log(`📨 Job added to queue for Post: ${postData.title}`);

    // 4. Cache Clear
    try {
      await this.cacheManager.del('feed_posts_0_10');
    } catch (e) {
      console.error('Cache clear failed', e);
    }

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
