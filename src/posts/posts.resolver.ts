import { Resolver, Query, Parent, ResolveField, Args, Int } from '@nestjs/graphql';
import { PostType } from './entities/post.type';
import { PostsService } from './posts.service';
import { UsersService } from 'src/users/users.service';
import { UserType } from 'src/users/entities/user.type';
@Resolver(() => PostType)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => [PostType], { name: 'feed' })
  async getFeed(
    // 👇 Arguments define karein (Default values ke saath)
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ) {
    return this.postsService.findAll(skip, limit);
  }

  // 🪄 MAGIC PART: Field Resolver
  @ResolveField(() => UserType) // Yeh batata hai ki 'author' field UserType return karega
  async author(@Parent() post: PostType) {
    // Parent (Post) se authorId nikalo aur User dhundho
    return this.usersService.findOne(post.authorId);
  }
}