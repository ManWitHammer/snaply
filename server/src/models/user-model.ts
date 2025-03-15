import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  nickname: string
  name: string
  surname: string
  email: string
  password: string
  avatar: string
}

const UserSchema: Schema = new Schema({
  nickname: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null, required: false },
})

export const UserModel = mongoose.model<IUser>('User', UserSchema)