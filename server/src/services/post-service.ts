import { UserModel } from '../models/user-model'
import { PostModel, IComment } from '../models/post-model'
import { ApiError } from '../exceptions/api-error'
import { Types } from "mongoose"
import fs from 'fs'
import tokenService from './token-service'
import Cassiopeia from './cassiopeia-service'
import SettingsStore from "../models/settings-model"

class PostService {
    async createPost(
        authHeader: string, 
        text: string, 
        images: string[], 
        options: {
            visibility: string,
            commentsEnabled: boolean,
            aiGenerated: boolean
        },
        hashtags: string[] = []
    ) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
        
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
        
        const user = await UserModel.findOne({ email: userData.email })
        
        if (!user) throw ApiError.UnauthorizedError()

        if (!text || text.trim().length === 0) {
            throw ApiError.BadRequest('Текст поста не может быть пустым')
        }

        if (text.length > 1200) {
            throw ApiError.BadRequest('Текст поста не может быть длиннее 5000 символов')
        }
    
        await Cassiopeia.updateTokens()
        const uploadedImages = await Promise.all(
            images.map(async (imagePath) => {
                try {
                    const buffer = fs.readFileSync(imagePath)
                    const fileName = imagePath.split('\\').pop()
                    if (!fileName) {
                        throw new Error('Некорректное имя файла')
                    }
                    
                    const result = await Cassiopeia.upload(buffer, fileName, true)
                    
                    if (!result || typeof result !== 'object' || !('uuid' in result)) {
                        throw new Error('Ошибка загрузки файла')
                    }
                    
                    return `https://cassiopeia-database-195be7295ffe.herokuapp.com/api/v1/files/public/${result.uuid}?${result.blurhash}`
                } catch (error) {
                    console.error(`Ошибка загрузки изображения ${imagePath}:`, error)
                    return null
                }
            })
        )
    
        const validImages = uploadedImages.filter(url => url !== null) as string[]
    
        const post = await PostModel.create({
            content: text,
            author: user._id,
            images: validImages,
            likes: [],
            comments: [],
            visibility: options.visibility,
            commentsEnabled: options.commentsEnabled,
            aiGenerated: options.aiGenerated,
            hashtags: hashtags
        })
        
        return post
    }    
    async getPosts(page: number, limit: number, authHeader: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
        
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
        
        const user = await UserModel.findOne({ email: userData.email }).populate('settings')
        
        if (!user) throw ApiError.UnauthorizedError()

        const posts = await PostModel.find({ visibility: 'Все' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'nickname name surname avatar')
            .select({
                'content': 1,
                'author': 1,
                'images': 1,
                'visibility': 1,
                'commentsEnabled': 1,
                'aiGenerated': 1,
                'createdAt': 1,
                'likes': 1,
                'commentsCount': { $size: '$comments' }
            })

        const updatedPosts = posts.map(post => {
            if (post.author && typeof post.author !== 'string' && 'avatar' in post.author && post.author.avatar === 'я' && post.author._id.equals(user._id as Types.ObjectId)) {
                post.author.avatar = null
            }
            return post
        })
        return updatedPosts
    }
    
    async getPost(authHeader: string, postId: string, page: number) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
        
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
        
        const user = await UserModel.findOne({ email: userData.email })

        const postData = await PostModel.findById(postId)

        if (!postData) throw ApiError.BadRequest("Пост не найден")
        
        if (!user) throw ApiError.UnauthorizedError()

        const post = await PostModel.findById(postId)
            .populate('author', 'nickname name surname avatar')
            .select({
                'content': 1,
                'author': 1,
                'images': 1,
                'visibility': 1,
                'commentsEnabled': 1,
                'aiGenerated': 1,
                'createdAt': 1,
                'likes': 1,
                'commentsCount': { $size: '$comments' }
            })

        const comments = await PostModel.findById(postId)
            .populate({
                path: 'comments',
                options: {
                    skip: (page - 1) * 10,
                    limit: 10,
                    sort: { createdAt: -1 }
                },
                populate: {
                    path: 'userId',
                    select: 'nickname name surname avatar'
                }
            })
            .select('comments')
        
        console.log(post, comments)
        return {
            post,
            comments: comments?.comments || []
        }
    }

    async countPosts() {
        return PostModel.countDocuments()
    }

    async toggleLike(authHeader: string, postId: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
                
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
            
        const user = await UserModel.findOne({ email: userData.email })
           
        if (!user) throw ApiError.UnauthorizedError()
            
        const userId = user._id as Types.ObjectId
        
        const post = await PostModel.findById(postId)
        if (!post) throw ApiError.BadRequest('Пост не найден')
        
        const likeIndex = post.likes.indexOf(userId)
        
        if (likeIndex === -1) {
            post.likes.push(userId)
        } else {
            post.likes.splice(likeIndex, 1)
        }
        
        await post.save()
        return post
    }        
    async addComment(authHeader: string, postId: string, text: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
                    
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
                
        const user = await UserModel.findOne({ email: userData.email })
               
        if (!user) throw ApiError.UnauthorizedError()
        
        const post = await PostModel.findById(postId)
        if (!post) throw ApiError.BadRequest('Post not found')
        
        const comment: IComment = {
            userId: user._id as Types.ObjectId,
            text,
            createdAt: new Date()
        }
        
        post.comments.push(comment)
        await post.save()
        
        const savedPost = await PostModel.findById(postId)
            .populate('comments.userId', 'name surname avatar')

        if (!savedPost) throw ApiError.BadRequest('Что-то пошло не так')
        
        return savedPost.comments[savedPost.comments.length - 1]
    }

    async editComment(authHeader: string, postId: string, commentId: string, text: string) {
        if (!authHeader) throw ApiError.UnauthorizedError();
        
        const userData = await tokenService.validateRefreshToken(authHeader);
        
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError();
        }
        
        const user = await UserModel.findOne({ email: userData.email });
        if (!user) throw ApiError.UnauthorizedError();
        
        const post = await PostModel.findById(postId);
        if (!post) throw ApiError.BadRequest('Пост не найден')

        // Находим комментарий через find + cast
        const comment = post.comments.find(c => c._id?.toString() === commentId);
        if (!comment) throw ApiError.BadRequest('Comment not found');

        if (comment.userId.toString() !== (user._id as Types.ObjectId).toString()) {
            throw ApiError.BadRequest('You can only edit your own comments');
        }

        comment.text = text;
        await post.save();
        
        const updatedPost = await PostModel.findById(postId)
            .populate('comments.userId', 'name surname avatar');
            
        if (!updatedPost) throw ApiError.BadRequest('Something went wrong');
        
        return comment;
    }
    
    async deleteComment(authHeader: string, postId: string, commentId: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        
        const userData = await tokenService.validateRefreshToken(authHeader)
        
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
        
        const user = await UserModel.findOne({ email: userData.email })
        
        if (!user) throw ApiError.UnauthorizedError()
        
        const post = await PostModel.findById(postId)
        if (!post) throw ApiError.BadRequest('Post not found')

        console.log(post, commentId)
        
        const commentIndex = post.comments.findIndex(comment => (comment._id as Types.ObjectId).toString() === commentId)
        if (commentIndex === -1) throw ApiError.BadRequest('Comment not found')

        const userId = user._id as Types.ObjectId
        
        if (post.comments[commentIndex].userId.toString() !== userId.toString()) {
            throw ApiError.BadRequest('You can only delete your own comments')
        }
        
        post.comments.splice(commentIndex, 1)
        await post.save()
        
        return { message: 'Comment deleted successfully' }
    }        
    
    async getComments(postId: string, page: number, limit: number) {
        const post = await PostModel.findById(postId)
            .select('comments')
            .slice('comments', [(page - 1) * limit, limit])
            .populate('comments.userId', 'name surname avatar')
        
        if (!post) throw ApiError.BadRequest('Post not found')
        return post.comments
    }

    async deletePost(authHeader: string, postId: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
        // Проверяем авторизацию
        const userData = await tokenService.validateRefreshToken(authHeader)

        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
                
        const user = await UserModel.findOne({ email: userData.email })
               
        if (!user) throw ApiError.UnauthorizedError()

        // Находим пост
        const post = await PostModel.findById(postId)
        if (!post) {
            throw ApiError.BadRequest('Пост не найден')
        }

        const userId = user._id as Types.ObjectId
        // Проверяем, что пользователь - автор поста
        if (post.author.toString() !== userId.toString()) {
            throw ApiError.BadRequest('Вы можете удалять только свои посты')
        }

        // Удаляем сам пост из базы
        const deletedPost = await PostModel.findByIdAndDelete(postId)

        if (!deletedPost) {
            throw ApiError.BadRequest('Ошибка при удалении поста')
        }

        return deletedPost
    }
    async searchPosts(prompt: string, page: number, limit: number, type: string, authHeader: string) {
        if (!authHeader) throw ApiError.UnauthorizedError()
            // Проверяем авторизацию
        const userData = await tokenService.validateRefreshToken(authHeader)
    
        if (typeof userData !== 'object' || !userData || !('email' in userData)) {
            throw ApiError.UnauthorizedError()
        }
                    
        const user = await UserModel.findOne({ email: userData.email })
                   
        if (!user) throw ApiError.UnauthorizedError()

        const searchQuery = type == "hashtag" 
            ? { visibility: 'Все', hashtags: { $in: [prompt] } }
            : { visibility: 'Все',
                $or: [
                    { content: { $regex: prompt, $options: 'i' } },
                    { hashtags: { $in: [prompt] } }
                ]
            }

        const posts = await PostModel.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'nickname name surname avatar')
            .select({
                'content': 1,
                'author': 1,
                'images': 1,
                'visibility': 1,
                'commentsEnabled': 1,
                'aiGenerated': 1,
                'createdAt': 1,
                'likes': 1,
                'commentsCount': { $size: '$comments' }
            })
        const total = await PostModel.countDocuments(searchQuery)

        return { posts, total }
    }

}

export default new PostService()