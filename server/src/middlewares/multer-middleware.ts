import path from 'path'
import fs from 'fs'
import multer, { FileFilterCallback } from 'multer'
import { ApiError } from '../exceptions/api-error'
import { Request } from 'express'

interface DeletionResultSuccess {
	filename: string
	path: string
	status: 'success'
  }
  
  interface DeletionResultError {
	filename: string
	path: string
	status: 'error'
	error: string
  }
  
  type DeletionResult = DeletionResultSuccess | DeletionResultError

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
    limits: { fileSize: 1024 * 1024 * 6, files: 1 },
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

export const imageUploads = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 8, files: 10 },
    fileFilter: (req, file, cb) => {
		const allowedTypes = [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif'
		]
		
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(ApiError.BadRequest(
				'Допустимые форматы: JPEG, PNG, WEBP, GIF'
			))
		}
	}
})

export const uploads = multer({
	storage: storage,
	limits: { 
	  fileSize: 1024 * 1024 * 8,
	  files: 5 
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = [
			'image/jpeg',
			'image/png',
			'image/webp',
			'image/gif'
		]
		
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(ApiError.BadRequest(
				'Допустимые форматы: JPEG, PNG, WEBP, GIF'
			))
		}
	}
})

export const deleteUploadedFiles = async (req: Request) => {
	const filesToDelete: Express.Multer.File[] = []
  
	if (req.file) {
	  filesToDelete.push(req.file)
	}
	
	if (req.files && Array.isArray(req.files)) {
	  filesToDelete.push(...req.files)
	}
  
	if (filesToDelete.length === 0) {
	  throw ApiError.BadRequest('Не найдено файлов для удаления')
	}
  
	const deletionResults: DeletionResult[] = await Promise.all(
	  filesToDelete.map(async (file) => {
		try {
		  await fs.promises.unlink(file.path)
		  return {
			filename: file.originalname,
			path: file.path,
			status: 'success' as const
		  }
		} catch (error) {
		  return {
			filename: file.originalname,
			path: file.path,
			status: 'error' as const,
			error: error instanceof Error ? error.message : 'Unknown error'
		  }
		}
	  })
	)
  
	const successResults = deletionResults.filter(
	  (result): result is DeletionResultSuccess => result.status === 'success'
	)
	
	const errorResults = deletionResults.filter(
	  (result): result is DeletionResultError => result.status === 'error'
	)
  
	console.log(`Удалено файлов: ${successResults.length}, ошибок: ${errorResults.length}`)
  
	if (errorResults.length > 0) {
	  const errorMessages = errorResults
		.map(r => `Файл ${r.filename}: ${r.error}`)
		.join('; ')
  
	  throw ApiError.BadRequest(`Ошибки при удалении файлов: ${errorMessages}`)
	}
  
	return {
	  totalFiles: filesToDelete.length,
	  deletedFiles: successResults.length,
	  failedFiles: errorResults.length,
	  details: deletionResults
	}
}