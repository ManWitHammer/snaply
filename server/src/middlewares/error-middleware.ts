import { ApiError } from '../exceptions/api-error';

export default function (error: any, req: any, res: any, next: any) { 
    console.error("Ошибка:", error)

    if (error instanceof ApiError) {
        return res.status(error.status).json({ message: error.message, errors: error.errors })
    }

    if (error.name === 'CastError' || error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Ошибка валидации данных', errors: error.errors })
    }

    if (error.message.includes('incorrect password')) { 
        return res.status(400).json({ message: 'Неверный пароль' })
    }

    return res.status(500).json({ message: 'Непредвиденная ошибка сервера' })
}