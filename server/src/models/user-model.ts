import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  nickname: string
  email: string
  password: string
}

const UserSchema: Schema = new Schema({
  nickname: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
})

export const UserModel = mongoose.model<IUser>('User', UserSchema)