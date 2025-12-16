import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { CloudinaryService } from 'src/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { SearchService } from 'src/search/search.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly cloudinaryService: CloudinaryService ,// Inject service
    private readonly searchService: SearchService //  Inject
  ) {}

  @UseGuards(AuthGuard('jwt')) // 🔒 TALA: Sirf Valid Token wale allow honge
  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' field name hoga form mein
  async create(
    @UploadedFile() file: Express.Multer.File, // File yahan aayegi
    @Body('title') title: string,
    @Body('content') content: string, // Text content yahan aayega
    @Request() req
  ) {
    let imageUrl = '';

    // 1. Agar file hai, toh Cloudinary par upload karo
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      imageUrl = result.secure_url; // CDN URL mil gaya!
    }

    // 2. Database mein save karo
    return this.postsService.create(
      { content, imageUrl, title }, // DTO match karana padega
      req.user.userId
    );
  }

  // 👇 GET /posts/search?q=apple
  @Get('search')
    async searchPosts(@Query('q') query: string) {
      if (!query) return [];
      return this.searchService.search(query);
    }
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
