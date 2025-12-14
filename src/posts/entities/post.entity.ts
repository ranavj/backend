import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true }) // CreatedAt/UpdatedAt auto-manage hoga
export class Post {
  @Prop({ required: true })
  content: string;

  @Prop() // Image URL (Cloudinary se aayega baad mein)
  imageUrl: string;

  @Prop({ required: true }) // Kaunse User ne post kiya (Postgres ID)
  authorId: string;

  @Prop({ default: 0 })
  likes: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);