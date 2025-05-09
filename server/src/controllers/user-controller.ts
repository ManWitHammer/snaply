import { Request, Response, NextFunction } from 'express'
import UserService from '../services/user-service'
import { ApiError } from '../exceptions/api-error'
import { deleteUploadedFiles } from '../middlewares/multer-middleware'
import "dotenv/config"

const MOBILE_APP_URL = process.env.MOBILE_APP_URL

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
			const userData = await UserService.checkAuth(authHeader)
			res.json(userData)
		} catch (err) {
			next(err)
		}
	}

  	async logout(req: Request, res: Response, next: NextFunction) {
		try {
			const authHeader = req.headers.authorization as string
			const userData = await UserService.logout(authHeader)
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
			const avatar = await UserService.setAvatar(authHeader, avatarPath)
			deleteUploadedFiles(req)
			res.json(avatar)
		} catch (err) {
			next(err)
		}
	}

	async activate(req: Request, res: Response, next: NextFunction) {
        const { link } = req.params
        try {
            await UserService.activate(link)
            return res.redirect(`${MOBILE_APP_URL}activation/success`)
        } catch (err) {
            next(err)
        }
    }

	async search(req: Request, res: Response, next: NextFunction) {
		try {
			const { prompt } = req.params
			const authHeader = req.headers.authorization as string
			const users = await UserService.search(authHeader, prompt)
			res.json(users)
		} catch (err) {
			next(err)
		}
	}

	async getUser(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = req.params
			const { page = 1 } = req.query
			const authHeader = req.headers.authorization as string
			const user = await UserService.getUser(authHeader, id, +page)
			res.json(user)
		} catch (err) {
			next(err)
		}
	}

	async patchUserInfo(req: Request, res: Response, next: NextFunction) {
		try {
			const { nickname, name, surname, description } = req.body
			const authHeader = req.headers.authorization as string
			const user = await UserService.patchUserInfo(authHeader, nickname, name, surname, description)
			res.json(user)
		} catch (err) {
			next(err)
		}
	}

	async uploadPhotos(req: Request, res: Response, next: NextFunction) {
		try {
			const authHeader = req.headers.authorization as string
            const contentImages = req.files 
                ? (req.files as Express.Multer.File[]).map(file => file.path) 
                : []
			const user = await UserService.uploadPhotos(authHeader, contentImages)
			deleteUploadedFiles(req)
			res.json(user)
		} catch (err) {
			next(err)
		}
	}

	async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { friendId } = req.params
            const authHeader = req.headers.authorization as string

            await UserService.handleFriendRequest(authHeader, friendId)
            res.json({ message: 'Friend request sent successfully' })
        } catch (err) {
            next(err)
        }
    }

    async acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { requesterId } = req.params
            const authHeader = req.headers.authorization as string

            await UserService.handleAcceptFriendRequest(authHeader, requesterId)
            res.json({ message: 'Friend request accepted successfully' })
        } catch (err) {
            next(err)
        }
    }

    async rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const { requesterId } = req.params
            const { selfReject } = req.query
            const authHeader = req.headers.authorization as string

            await UserService.handleRejectFriendRequest(authHeader, requesterId, selfReject === 'true')
            res.json({ message: 'Friend request rejected successfully' })
        } catch (err) {
            next(err)
        }
    }

	async getFriends(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { page = 1, limit = 50 } = req.query
            const friends = await UserService.getFriends(
                authHeader, 
                +page, 
                +limit
            )
            res.json(friends)
        } catch (err) {
            next(err)
        }
    }

    async getFriendRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { page = 1, limit = 50 } = req.query
            const requests = await UserService.getFriendRequests(
                authHeader,
                +page,
                +limit
            )
            res.json(requests)
        } catch (err) {
            next(err)
        }
    }

	async getAllPhotos(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
			const { id } = req.params
            const { page = 1, limit = 30 } = req.query
            const photos = await UserService.getAllPhotos(
                authHeader,
				id,
                +page,
                +limit
            )
            res.json(photos)
        } catch (err) {
            next(err)
        }
    }

	async deleteFriend(req: Request, res: Response, next: NextFunction) {
        try {
            const { requesterId } = req.params
            const authHeader = req.headers.authorization as string

            await UserService.deleteFriend(authHeader, requesterId)
            res.json({ message: 'Friend request accepted successfully' })
        } catch (err) {
            next(err)
        }
    }

    async getUserPrivacy(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string

            const privacy = await UserService.getUserPrivacy(authHeader)
            res.json(privacy)
        } catch (err) {
            next(err)
        }
    }

    async updateUserPrivacy(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { settings } = req.body

            const privacy = await UserService.updateUserPrivacy(authHeader, settings)
            res.json(privacy)
        } catch (err) {
            next(err)
        }
    }

    async getUserFriends(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { id } = req.params
            const { page = 1, limit = 50 } = req.query

            const friends = await UserService.getUserFriends(authHeader, id, +page, +limit)
            res.json(friends)
        } catch(err) {
            next(err)
        }
    }

    async getSharedImages(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { id } = req.params
            const { page = 1, limit = 50 } = req.query

            const friends = await UserService.getSharedImages(authHeader, id, +page, +limit)
            res.json(friends)
        } catch(err) {
            next(err)
        }
    }
}

export default new UserController()