import { Schema, model, Document, Types } from 'mongoose';

export interface IComment {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  content: string;
  author: Types.ObjectId;
  images: string[];
  likes: Types.ObjectId[];
  comments: IComment[];
  visibility: "Все" | "друзья" | "я";
  commentsEnabled: boolean;
  aiGenerated: boolean;
  hashtags: string[]
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const PostSchema = new Schema<IPost>({
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String }],
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    visibility: { type: String, default: "Все" },
    commentsEnabled: { type: Boolean, default: true },
    aiGenerated: { type: Boolean, default: false },
    hashtags: [{ type: String, default: [] }],
    createdAt: { type: Date, default: Date.now }
  }
)

export const PostModel = model<IPost>('Post', PostSchema);