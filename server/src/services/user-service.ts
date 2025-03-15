import { UserModel } from '../models/user-model'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ApiError } from '../exceptions/api-error'
import tokenService from '../services/token-service'

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
    const tokens = await tokenService.generateTokens({ ...user })
    await tokenService.saveToken(user._id as string, tokens.refreshToken)
    return { ...tokens, user }
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
    const token = jwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' })
    return token
  }
}

export default new UserService()