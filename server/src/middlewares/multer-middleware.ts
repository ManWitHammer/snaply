import fs from 'fs'
import multer, { FileFilterCallback  } from 'multer'
import path from 'path'
import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../exceptions/api-error'
import tokenService from '../services/token-service'
import { UserModel } from '../models/user-model'

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './uploads')
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		const extension = path.extname(file.originalname)
		cb(null, file.fieldname + '-' + uniqueSuffix + extension)
	}
})

export const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 4, files: 1 },
    fileFilter: (req, file, cb: FileFilterCallback) => {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/webp'
        ) {
            cb(null, true)
        } else {
            cb(null, false)
			cb(
				ApiError.BadRequest(
					'Допустимые форматы для аватарки: .png, .jpg, .webp and .jpeg'
				)
			)
        }
    }
})

export const deleteFileOnError = (req: Request, res: Response, next: NextFunction) => {
	const prevResponse = res
	console.log(req.file?.path) 

	if (req.file) {
		try {
			console.log('Удаляю файл: ', req.file.path)
			fs.unlink(req.file.path, err => {
				if (err) {
					console.error('Ошибка при удалении файла:', err)
					return next(err)
				}
				console.log('Файл успешно удален')
				next(prevResponse)
			})
		} catch (err) {
			console.error('Не удалось удалить файл:', err)
			next(err)
		}
	} else {
		next() 
	}
}

export const deletePreviousFile = async (req: Request) => {
	const authHeader = req.headers.authorization as string

	const userData = await tokenService.validateRefreshToken(authHeader)
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })

    if (!user) throw ApiError.UnauthorizedError()

	if (user.avatar) {
		console.log('Удаляю файл: ', user.avatar)
		fs.unlink(user.avatar, err => {
			if (err) {
				console.error('Ошибка при удалении файла:', err)
			}
			console.log('Файл успешно удален')
		})
	}
}