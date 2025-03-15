import { Schema, model } from 'mongoose'

const TokenSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', require: true },
	refreshToken: { type: String, require: true }
})

const TokenModel = model('Token', TokenSchema)
export default TokenModel