 import { model, Document, Schema, Types } from 'mongoose'

export interface ISettings extends Document {
    user: Types.ObjectId
    avatar: "Все" | "Друзья" | "Только я"
    posts: "Все" | "Друзья" | "Только я"
    photos: "Все" | "Друзья" | "Только я"
    friends: "Все" | "Друзья" | "Только я"
}

const SettingsSchema: Schema = new Schema<ISettings>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	avatar: { type: String, enum: ["Все", "Друзья", "Только я"], default: "Все" },
    posts: { type: String, enum: ["Все", "Друзья", "Только я"], default: "Все" },
    photos: { type: String, enum: ["Все", "Друзья", "Только я"], default: "Все" },
    friends: { type: String, enum: ["Все", "Друзья", "Только я"], default: "Все" }
})

const SettingsModel = model('Setting', SettingsSchema)
export default SettingsModel