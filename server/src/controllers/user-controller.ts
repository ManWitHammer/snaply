import { Request, Response, NextFunction } from 'express'
import UserService from '../services/user-service'

class UserController {
  async registration(req: Request, res: Response, next: NextFunction) {
    try {
      const { nickname, name, surname, email, password } = req.body
      const user = await UserService.register(nickname, name, surname, email, password)
      res.cookie('refreshToken', user.refreshToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: true,
          httpOnly: true,
          sameSite: 'none'
      })
      res.send(user)
    } catch (err) {
      next(err)
    }
  }
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { nickname, password } = req.body
      const token = await UserService.login(nickname, password)
      res.send({ token })
    } catch (err) {
      next(err)
    }
  }
}

export default new UserController()