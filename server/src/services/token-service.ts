import jwt from 'jsonwebtoken'
import TokenModel from '../models/token-model'


class tokenService {
    async findToken(refreshToken: string) {
        const tokenData = await TokenModel.findOne({ refreshToken })
        return tokenData
    }
	async generateTokens(payload: object) {
		const accessToken = jwt.sign(payload, "asdasdasdasdas", {
			expiresIn: '15m'
		})
		const refreshToken = jwt.sign(payload, "asdasdasdsaasd", {
			expiresIn: '30d'
		})

		return { accessToken, refreshToken }
	}

	async validateAccessToken(token: string) {
		try {
			const userData = jwt.verify(token, "asdasdasdasdas")
			console.log(userData)
			return userData
		} catch (err) {
			return null
		}
	}

	async validateRefreshToken(token: string) {
		try {
			const trueToken = await this.findToken(token)
			if (trueToken) {
				const userData = jwt.verify(token, "asdasdasdsaasd")
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