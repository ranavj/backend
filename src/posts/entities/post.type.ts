import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserType } from 'src/users/entities/user.type';

@ObjectType() // Yeh batata hai ki yeh GraphQL output hai
export class PostType {
  @Field(() => ID)
  _id: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  authorId: string;

  @Field(() => Int)
  likes: number;

  @Field()
  createdAt: Date;

  @Field(() => UserType) // 👈 Naya Field
  author: UserType;
}