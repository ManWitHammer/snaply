import { Request, Response, NextFunction } from 'express'
import UserService from '../services/user-service'
import { ApiError } from '../exceptions/api-error'
import { deletePreviousFile } from '../middlewares/multer-middleware'

class UserController {
  async registration(req: Request, res: Response, next: NextFunction) {
    try {
      const { nickname, name, surname, email, password } = req.body
      const user = await UserService.register(nickname, name, surname, email, password)
      res.send(user)
    } catch (err) {
      next(err)
    }
  }
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { nickname, password } = req.body
      const user = await UserService.login(nickname, password)
      res.send(user)
    } catch (err) {
      next(err)
    }
  }
  async checkAuth(req: Request, res: Response, next: NextFunction) {
		try {
			const authHeader = req.headers.authorization as string
      console.log(req.headers.authorization)
			const userData = await UserService.checkAuth(authHeader)
			res.json(userData)
		} catch (err) {
			next(err)
		}
	}
  async setAvatar(req: Request, res: Response, next: NextFunction) {
		try {
			const authHeader = req.headers.authorization as string
			const avatarPath = req.file ? req.file.path : null
			if (!avatarPath) throw ApiError.BadRequest('Необходимо загрузить аватарку')
      deletePreviousFile(req)
			const avatar = await UserService.setAvatar(authHeader, avatarPath)
			res.json(avatar)
		} catch (err) {
			next(err)
		}
	}
}

export default new UserController()