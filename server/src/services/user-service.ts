import { UserModel } from '../models/user-model'
import bcrypt from 'bcrypt'
import UserDto from '../dto/user-dto'
import { ApiError } from '../exceptions/api-error'
import tokenService from '../services/token-service'
import fs from "fs"

class UserService {
  async register(nickname: string, name: string, surname: string, email: string, password: string) {
    if(!nickname || !password || !name || !surname || !email) {
      throw ApiError.BadRequest('Заполните все поля')
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    const foundedUser = await UserModel.findOne({ nickname })
    if (foundedUser) {
      throw ApiError.BadRequest('Такой пользователь уже есть')
    }
    const user = new UserModel({ nickname, email, name, surname, password: hashedPassword })
    await user.save()
    const userDto = new UserDto(user)
    const tokens = await tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id as string, tokens.refreshToken)
    return { ...tokens, userDto }
  }

  async login(nickname: string, password: string) {
    if(!nickname || !password) {
      throw ApiError.BadRequest('Заполните все поля')
    }
    const user = await UserModel.findOne({ nickname })
    if (!user) {
      throw ApiError.BadRequest('Пользователь не найден')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw ApiError.BadRequest('Не правильный пароль')
    }
    const userDto = new UserDto(user)
    const tokens = await tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id as string, tokens.refreshToken)
    return { ...tokens, userDto }
  }

  async checkAuth(authHeader: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()

    const userData = await tokenService.validateRefreshToken(authHeader)
    
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })

    if (!user) throw ApiError.UnauthorizedError()

    const userDto = new UserDto(user)
    return { userDto }
  }
  async setAvatar(authHeader: string, avatarPath: string) {
		if (!authHeader) throw ApiError.UnauthorizedError()

      const userData = await tokenService.validateRefreshToken(authHeader)

      if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
      }

      const user = await UserModel.findOne({ email: userData.email })
  
      if (!userData || !user) throw ApiError.UnauthorizedError()
      if (avatarPath !== null) {
        user.avatar = avatarPath
        await user.save()
        return { user: "http://192.168.0.54:3000/" + avatarPath }
      }
      else {
        return { user: "http://192.168.0.54:3000/" + user.avatar }
      }
	}
}

export default new UserService()