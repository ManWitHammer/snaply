import jwt from 'jsonwebtoken'
import TokenModel from '../models/token-model'
import 'dotenv/config'

const JWT_TOKEN = process.env.JWT_SECRET!

class tokenService {
    async findToken(refreshToken: string) {
        const tokenData = await TokenModel.findOne({ refreshToken })
        return tokenData
    }
	async generateTokens(payload: object) {
		const refreshToken = jwt.sign(payload, JWT_TOKEN, {
			expiresIn: '30d'
		})

		return { refreshToken }
	}

	async validateRefreshToken(token: string) {
		try {
			const trueToken = await this.findToken(token)
			if (trueToken) {
				const userData = jwt.verify(token, JWT_TOKEN)
				return userData
			}
			return null
		} catch (err) {
			return null
		}
	}

	async saveToken(userId: string, refreshToken: string) {
		const tokenData = await TokenModel.findOne({ user: userId })
		if (tokenData) {
			tokenData.refreshToken = refreshToken
			return tokenData.save()
		}

		const token = await TokenModel.create({ user: userId, refreshToken })
		return token
	}

	async removeToken(refreshToken: string) {
		const tokenData = await TokenModel.deleteOne({ refreshToken })
		return tokenData
	}
}

export default new tokenService()