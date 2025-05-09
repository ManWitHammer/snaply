import { Router } from 'express'
import UserController from '../controllers/user-controller'
import PostController from '../controllers/post-controller'
import ChatController from '../controllers/chat-controller'
import { upload, uploads, imageUploads } from '../middlewares/multer-middleware'

const router = Router()

//user
router.patch('/user/info', UserController.patchUserInfo)
router.post('/register', UserController.registration)
router.post('/login', UserController.login)
router.patch('/user/avatar', upload.single('avatar'), UserController.setAvatar)
router.get('/logout', UserController.logout)
router.get('/checkauth', UserController.checkAuth)
router.get('/search/:prompt', UserController.search)
router.get('/user/:id', UserController.getUser)
router.get('/activate/:link', UserController.activate)
router.post('/friends/request/:friendId', UserController.sendFriendRequest)
router.post('/friends/accept/:requesterId', UserController.acceptFriendRequest)
router.post('/friends/reject/:requesterId', UserController.rejectFriendRequest)
router.delete('/friends/delete/:requesterId', UserController.deleteFriend)
router.get('/friends', UserController.getFriends);
router.get('/friend-requests', UserController.getFriendRequests);
router.get('/photos/:id', UserController.getAllPhotos)
router.post('/user/photos', imageUploads.array('images'), UserController.uploadPhotos)
router.get('/user/info/privacy', UserController.getUserPrivacy)
router.patch('/user/info/privacy', UserController.updateUserPrivacy)
router.get('/user/info/friends/:id', UserController.getUserFriends)
router.get('/user/info/sharedImages/:id', UserController.getSharedImages)
//posts
router.get('/posts', PostController.getPosts)
router.get('/post/:postId', PostController.getPost)
router.post('/post/:postId/like', PostController.toggleLike)
router.post('/post/:postId/comments', PostController.addComment)
router.get('/post/:postId/comments', PostController.getComments)
router.post('/posts', uploads.array('images'), PostController.createPost)
router.get('/posts/search/:prompt', PostController.searchPosts)
router.patch('/post/:postId/comments/:commentId', PostController.editComment)
router.delete('/post/:postId/comments/:commentId', PostController.deleteComment)
router.delete('/post/:postId', PostController.deletePost)
//chats
router.get('/chats', ChatController.getChats)
router.get('/chat/:chatId', ChatController.getMessages)
router.post('/chat/:chatId', upload.single('image'), ChatController.sendMessage)
router.patch('/chat/:chatId/:messageId', ChatController.editMessage)
router.delete('/chat/:chatId/:messageId', ChatController.deleteMessage)
export default router