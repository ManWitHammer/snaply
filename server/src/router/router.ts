import { Router } from 'express'
import UserController from '../controllers/user-controller'
import { upload } from '../middlewares/multer-middleware'

const router = Router()

router.post('/register', UserController.registration)
router.post('/login', UserController.login)
router.post('/setavatar', upload.single('avatar'), UserController.setAvatar)
router.get('/checkauth', UserController.checkAuth)

export default router