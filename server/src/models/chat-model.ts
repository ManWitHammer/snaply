import { Schema, Document, Types, model } from 'mongoose'

export interface IMessage extends Document {
  sender: Types.ObjectId
  content: string | null
  timestamp: Date
  image: string | null
  isEdited: boolean
  forwardedFromUser?: Types.ObjectId
  forwardedFromPost?: Types.ObjectId
}

export interface IChat extends Document {
  name?: string
  participants: Types.ObjectId[]
  messages: IMessage[]
  isGroup: boolean
  admin?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  timestamp: { type: Date, default: Date.now },
  image: { type: String },
  isEdited: { type: Boolean, default: false },
  forwardedFromUser: { type: Schema.Types.ObjectId, ref: 'User' },
  forwardedFromPost: { type: Schema.Types.ObjectId, ref: 'Post' },
})

const ChatSchema: Schema = new Schema({
  name: { type: String },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  messages: [MessageSchema],
  isGroup: { type: Boolean, default: false },
  admin: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const ChatModel = model<IChat>('Chat', ChatSchema)