import mongoose, { Document, Schema } from 'mongoose';

export interface IPrivacySettings {
  avatar: "Все" | "друзья" | "я";
  photos: "Все" | "друзья" | "я";
  friends: "Все" | "друзья" | "я";
  posts: "Все" | "друзья" | "я";
}

export interface IUserBase {
  nickname: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  avatar: string | null;
  description?: string;
  photos: string[];
  friends: mongoose.Types.ObjectId[];
  friendRequests: mongoose.Types.ObjectId[];
  registrationDate: Date;
  lastLogin: Date;
  blockedUsers: mongoose.Types.ObjectId[];
  status: 'online' | 'offline';
  socketId: string | null;
  isActivated: boolean;
  activationLink: string;
  settings: mongoose.Types.ObjectId
}

export interface IUser extends IUserBase, Document {}

const UserSchema: Schema = new Schema<IUser>({
  nickname: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  description: { type: String, default: '' },
  photos: [{ type: String, default: [] }],
  friends: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  registrationDate: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  socketId: { type: String, default: null },
  isActivated: { type: Boolean, default: false, required: true },
  activationLink: { type: String, required: true },
  settings: { type: Schema.Types.ObjectId, ref: 'Setting' }
});

// Модель пользователя
export const UserModel = mongoose.model<IUser>('User', UserSchema);