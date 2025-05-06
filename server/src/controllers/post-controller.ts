import { Request, Response, NextFunction } from 'express'
import PostService from '../services/post-service'
import { deleteUploadedFiles } from '../middlewares/multer-middleware'

function extractHashtags(text: string): string[] {
    const hashtagRegex = /(^|\s)(#[a-zA-Zа-яА-Я0-9_]+)/g;
    const matches = text.match(hashtagRegex)
    if (!matches) return [];
    
    return matches.map(match => match.trim().slice(1))
}

class PostController {
    async createPost(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string;
            const contentImages = req.files 
                ? (req.files as Express.Multer.File[]).map(file => file.path) 
                : [];
            
            const options = req.body.options 
                ? JSON.parse(req.body.options) 
                : {};
            
            const { text } = req.body;
            
            const hashtags = extractHashtags(text);
            
            const post = await PostService.createPost(
                authHeader, 
                text, 
                contentImages, 
                options,
                hashtags 
            )

            if (contentImages.length > 0) deleteUploadedFiles(req)
            
            res.json(post)
        } catch (err) {
            next(err);
        }
    }

    async getPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 10 } = req.query
            const authHeader = req.headers.authorization as string;
            const posts = await PostService.getPosts(
                +page,
                +limit,
                authHeader
            )
            res.json({
                data: posts,
                meta: {
                    currentPage: Number(page),
                    itemsPerPage: Number(limit),
                    totalItems: await PostService.countPosts(),
                    totalPages: Math.ceil(await PostService.countPosts() / Number(limit))
                }
            })
        } catch (err) {
            next(err)
        }
    }

    async getPost(req: Request, res: Response, next: NextFunction) {
        try {
            const { postId } = req.params
            const authHeader = req.headers.authorization as string
            const { page = 1 } = req.query
            console.log(authHeader, postId, +page)
            const post = await PostService.getPost(authHeader, postId, +page)
            res.json(post)
        } catch (err) {
            next(err)
        }
    }

    // Лайк/дизлайк поста
    async toggleLike(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { postId } = req.params
            const updatedPost = await PostService.toggleLike(authHeader, postId)
            res.json(updatedPost)
        } catch (err) {
            next(err)
        }
    }

    // Добавление комментария
    async addComment(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { postId } = req.params
            const { text } = req.body
            const comment = await PostService.addComment(authHeader, postId, text)
            res.status(201).json(comment)
        } catch (err) {
            next(err)
        }
    }

    async editComment(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { postId, commentId } = req.params
            const { text } = req.body
            const comment = await PostService.editComment(authHeader, postId, commentId, text)
            res.json(comment)
        } catch (err) {
            next(err)
        }
    }

    async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { postId, commentId } = req.params
            const comment = await PostService.deleteComment(authHeader, postId, commentId)
            res.json(comment)
        } catch (err) {
            next(err)
        }
    }
    // Получение комментариев поста
    async getComments(req: Request, res: Response, next: NextFunction) {
        try {
            const { postId } = req.params
            const { page = 1, limit = 10 } = req.query
            const comments = await PostService.getComments(
                postId,
                +page,
                +limit
            )
            res.json({
                data: comments,
                meta: {
                    postId,
                    currentPage: +page,
                    itemsPerPage: +limit
                }
            })
        } catch (err) {
            next(err)
        }
    }

    async deletePost(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string
            const { postId } = req.params
            
            const deletedPost = await PostService.deletePost(authHeader, postId)
            res.json(deletedPost)
        } catch (err) {
            next(err)
        }
    }

    async searchPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization as string;
            const { prompt } = req.params;
            const { page = 1, limit = 10, type } = req.query;
            
            const result = await PostService.searchPosts(
                prompt,
                +page,
                +limit,
                type as string,
                authHeader
            );
            
            res.json({
                data: result.posts,
                meta: {
                    currentPage: Number(page),
                    itemsPerPage: Number(limit),
                    totalItems: result.total,
                    totalPages: Math.ceil(result.total / Number(limit))
                }
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new PostController()