import { UserModel, IPrivacySettings } from '../models/user-model'
import bcrypt from 'bcrypt'
import UserDto from '../dto/user-dto'
import { ApiError } from '../exceptions/api-error'
import tokenService from './token-service'
import mailService from './mail-service'
import SocketService from './socket-service'
import { ChatModel } from '../models/chat-model'
import { PostModel } from '../models/post-model'
import SettingsModel from '../models/settings-model'
import { v4 as uuidv4 } from 'uuid'
import fs from "fs"
import { Types } from 'mongoose'
import Cassiopeia from './cassiopeia-service'

class UserService {
  async register(nickname: string, name: string, surname: string, email: string, password: string) {
    if(!nickname || !password || !name || !surname || !email) {
      throw ApiError.BadRequest('Заполните все поля')
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    const activationLink = uuidv4()
    const foundedUser = await UserModel.findOne({ nickname })
    if (foundedUser) {
      throw ApiError.BadRequest('Такой пользователь уже есть')
    }
    const user = new UserModel({ nickname, email, name, surname, password: hashedPassword, activationLink })
    await user.save()
    await mailService.sendActivationMail(email, `${process.env.SERVER_URL}/api/activate/${activationLink}`)
    const userDto = new UserDto(user)
    const tokens = await tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id as string, tokens.refreshToken)
    return { ...tokens, userDto }
  }

  async login(nickname: string, password: string) {
    if(!nickname || !password) {
      throw ApiError.BadRequest('Заполните все поля')
    }
    const user = await UserModel.findOne({ nickname })
    if (!user) {
      throw ApiError.BadRequest('Пользователь не найден')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw ApiError.BadRequest('Не правильный пароль')
    }
    const userDto = new UserDto(user)
    const tokens = await tokenService.generateTokens({ ...userDto })
    await tokenService.saveToken(userDto.id as string, tokens.refreshToken)
    return { ...tokens, userDto }
  }

  async checkAuth(authHeader: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()

    const userData = await tokenService.validateRefreshToken(authHeader)
    
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })

    if (!user) throw ApiError.UnauthorizedError()

    const userDto = new UserDto(user)
    return { userDto }
  }

  async activate(activationLink: string) {
    const user = await UserModel.findOne({ activationLink })
    if (!user) {
        throw ApiError.BadRequest('Некорректная ссылка активации')
    }

    user.isActivated = true
    await user.save()
    await SocketService.notifyAccountActivation(user._id as string)

    return user
  }

  async logout(authHeader: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const token = await tokenService.removeToken(authHeader)
    return token
  }

  async setAvatar(authHeader: string, avatarPath: string) {
		if (!authHeader) throw ApiError.UnauthorizedError()

    const userData = await tokenService.validateRefreshToken(authHeader)

    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })
  
    if (!userData || !user) throw ApiError.UnauthorizedError()
    if (avatarPath) {
      await Cassiopeia.updateTokens()
      const buffer = fs.readFileSync(avatarPath)
      const fileName = avatarPath.split('\\').pop()
      if (!fileName) {
        throw ApiError.UnauthorizedError()
      }
      const result = await Cassiopeia.upload(buffer, fileName, true)
      console.log(result)
      if (!result || typeof result !== 'object' || !('uuid' in result)) {
        throw ApiError.UnauthorizedError()
      }
      user.avatar = `https://cassiopeia-database-195be7295ffe.herokuapp.com/api/v1/files/public/${result.uuid}?${result.blurhash}`
      await user.save()
      return { user: user.avatar }
    }
    else {
      return { user: user.avatar }
    }
	}

  async search(authHeader: string, prompt: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }

    const currentUser = await UserModel.findOne({ email: userData.email })
    if (!currentUser) throw ApiError.UnauthorizedError()

    const users = await UserModel.find({
      $or: [
        { nickname: { $regex: prompt, $options: 'i' } },
        { name: { $regex: prompt, $options: 'i' } },
        { surname: { $regex: prompt, $options: 'i' } },
      ],
    }).select('name surname nickname avatar friends settings').limit(10)

    let usersData = users.filter((user) => user.nickname !== userData.nickname)

    const populatedUsersData = await Promise.all(usersData.map(async (user) => {
      if (!user.settings) {
        return user
      }
      const settings = await SettingsModel.findById(user.settings).lean()
      if (!settings) return user

      switch (settings.avatar) {
        case 'Все':
          break
        case 'Друзья':
          if (!user.friends.map(f => f.toString()).includes((currentUser._id as Types.ObjectId).toString())) {
            user.avatar = null
          }
          break
        case 'Только я':
          if ((user._id as Types.ObjectId).toString() !== (currentUser._id as Types.ObjectId).toString()) {
            user.avatar = null
          }
          break
        default:
          break
      }

      switch (settings.friends) {
        case 'Все':
          break
        case 'Друзья':
          if (!user.friends.map(f => f.toString()).includes((currentUser._id as Types.ObjectId).toString())) {
            user.friends = []
          }
          break
        case 'Только я':
          if ((user._id as Types.ObjectId).toString() !== (currentUser._id as Types.ObjectId).toString()) {
            user.friends = []
          }
          break
        default:
          break
      }

      return user
    }))

    return populatedUsersData
  }

  async getUser(authHeader: string, id: string, page: number = 1) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
    
    const currentUser = await UserModel.findOne({ email: userData.email })
    if (!currentUser) throw ApiError.UnauthorizedError()
    
    const limit = 10
    const skip = (page - 1) * limit
    const user = await UserModel.findById(id)
      .select({
        'name': 1,
        'surname': 1,
        'nickname': 1,
        'avatar': 1,
        'description': 1,
        'status': 1,
        'photos': { $slice: -6 },
        'friendsCount': { $size: '$friends' },
        'isFriend': { $in: [currentUser._id, '$friends'] },
        'hasPendingRequest': { $in: [id, currentUser.friendRequests.map(el => el.toString())] },
        'sentRequest': { $in: [currentUser._id, '$friendRequests'] },
        'friends': 1,
        'settings': 1
      })
      .populate({
        path: 'friends',
        select: 'avatar',
        options: { limit: 3, sort: { _id: -1 } }
      })
    
    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    if (user.settings) {
      const settings = await SettingsModel.findById(user.settings).lean()
      if (settings) {
        switch (settings.avatar) {
          case 'Все':
            break
          case 'Друзья':
            if (!user.friends.map(f => f._id.toString()).includes((currentUser._id as Types.ObjectId).toString())) {
              user.avatar = null
            }
            break
          case 'Только я':
            if ((user._id as Types.ObjectId).toString() !== (currentUser._id as Types.ObjectId).toString()) {
              user.avatar = null
            }
            break
          default:
            break
        }

        switch (settings.friends) {
          case 'Все':
            break
          case 'Друзья':
            if (!user.friends.map(f => f._id.toString()).includes((currentUser._id as Types.ObjectId).toString())) {
              user.friends = []
            }
            break
          case 'Только я':
            if ((user._id as Types.ObjectId).toString() !== (currentUser._id as Types.ObjectId).toString()) {
              user.friends = []
            }
            break
          default:
            break
        }

        switch (settings.photos) {
          case 'Все':
            break
          case 'Друзья':
            if (!user.friends.map(f => f._id.toString()).includes((currentUser._id as Types.ObjectId).toString())) {
              user.photos = []
            }
            break
          case 'Только я':
            if ((user._id as Types.ObjectId).toString() !== (currentUser._id as Types.ObjectId).toString()) {
              user.photos = []
            }
            break
          default:
            break
        }
      }
    }
    
    let chatId = null;
    const chat = await ChatModel.findOne({
      participants: {
        $all: [currentUser._id, user._id],
        $size: 2
      }
    }).select('_id').lean();
      
    chatId = chat?._id || null;
    
    let postsQuery = PostModel.find({ author: id })
      .sort({ createdAt: -1 })
      .skip(skip)
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

    if (user.settings) {
      const settings = await SettingsModel.findById(user.settings).lean()
      if (settings) {
        switch (settings.posts) {
          case 'Все':
            break
          case 'Друзья':
            if (!user.friends.map(f => f._id.toString()).includes((currentUser._id as Types.ObjectId).toString())) {
              postsQuery = PostModel.find({ author: id, _id: null })
            }
            break
          case 'Только я':
            if ((user._id as Types.ObjectId).toString() !== (currentUser._id as Types.ObjectId).toString()) {
              postsQuery = PostModel.find({ author: id, _id: null })
            }
            break
          default:
            break
        }
      }
    }

    const posts = await postsQuery

    return { 
      user: {
        ...user.toObject(),
        chatId
      }, 
      posts 
    }
  }  
  
  async patchUserInfo(authHeader: string, nickname: string, name: string, surname: string, description: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
    const user = await UserModel.findOne({ email: userData.email })
    if (!user) throw ApiError.BadRequest('Пользователь не найден')
    if (name) user.name = name
    if (surname) user.surname = surname
    if (nickname) user.nickname = nickname
    if (description) user.description = description
    await user.save()
    return user
  }

  async uploadPhotos(authHeader: string, photos: string[]) {
    if (!authHeader) throw ApiError.UnauthorizedError()

    const userData = await tokenService.validateRefreshToken(authHeader)
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })
    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    if (photos.length > 0) {
      await Cassiopeia.updateTokens()
      for (const photoPath of photos) {
        const buffer = fs.readFileSync(photoPath)
        const fileName = photoPath.split('\\').pop()
        if (!fileName) {
          throw ApiError.UnauthorizedError()
        }

        const result = await Cassiopeia.upload(buffer, fileName, true)
        console.log(result)

        if (!result || typeof result !== 'object' || !('uuid' in result)) {
          throw ApiError.UnauthorizedError()
        }

        const photoUrl = `https://cassiopeia-database-195be7295ffe.herokuapp.com/api/v1/files/public/${result.uuid}?${result.blurhash}`

        if (!Array.isArray(user.photos)) {
          user.photos = []
        }
        user.photos.push(photoUrl)
      }

      await user.save()
    }

    return { message: "yahoo!" }
  }

  async handleFriendRequest(authHeader: string, friendId: string) {
    try {
      if (!authHeader) throw ApiError.UnauthorizedError()
      const userData = await tokenService.validateRefreshToken(authHeader)
      if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
      }
      const user = await UserModel.findOne({ email: userData.email })
      if (!user) throw ApiError.UnauthorizedError()
      const friend = await UserModel.findById(friendId)

      if (!friend) throw ApiError.BadRequest('Пользователь не найден')

      if (user?.friends.includes(new Types.ObjectId(friendId))) {
        throw ApiError.BadRequest('Вы уже итак в друзьях')
      }

      if (friend.friendRequests.includes(user._id as Types.ObjectId)) {
        throw ApiError.BadRequest('Запрос в друья уже добавлен')
      }

      await UserModel.findByIdAndUpdate(friendId, {
        $addToSet: { friendRequests: user._id }
      })

      await SocketService.notifyNewFriendRequest(user._id as string, friendId)
    } catch (error) {
        throw error
    }
  }

  async handleAcceptFriendRequest(authHeader: string, requesterId: string) {
    try {
      if (!authHeader) throw ApiError.UnauthorizedError()
      const userData = await tokenService.validateRefreshToken(authHeader)

      if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
      }

      const user = await UserModel.findOne({ email: userData.email })
      if (!user) throw ApiError.UnauthorizedError()

      await UserModel.findByIdAndUpdate(user._id, {
        $pull: { friendRequests: new Types.ObjectId(requesterId) },
        $addToSet: { friends: new Types.ObjectId(requesterId) }
      })

      await UserModel.findByIdAndUpdate(requesterId, {
        $addToSet: { friends: user._id as Types.ObjectId }
      })
      
      const existingChat = await ChatModel.findOne({
        participants: { $all: [user._id, new Types.ObjectId(requesterId)] },
        isGroup: false
      })

      if (!existingChat) {
        const newChat = new ChatModel({
          participants: [user._id, new Types.ObjectId(requesterId)],
          messages: [],
          isGroup: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })

        await newChat.save()
      }
      await SocketService.notifyFriendRequestAccepted(user._id as string, requesterId)
    } catch (error) {
      throw error
    }
  }

  async handleRejectFriendRequest(authHeader: string, requesterId: string, selfReject: boolean = false) {
    try {
      if (!authHeader) throw ApiError.UnauthorizedError()
      const userData = await tokenService.validateRefreshToken(authHeader)
    
      if (typeof userData !== 'object' || !userData || !('email' in userData)) {
        throw ApiError.UnauthorizedError()
      }
    
      const user = await UserModel.findOne({ email: userData.email })
      if (!user) throw ApiError.UnauthorizedError()
          
      if (!selfReject) {
        if ((user._id as Types.ObjectId).toString() === requesterId) {
          throw ApiError.BadRequest('You cannot reject your own friend request')
        }

        if (!user?.friendRequests.includes(new Types.ObjectId(requesterId))) {
          throw ApiError.BadRequest('Friend request not found')
        }

        await UserModel.findByIdAndUpdate(user._id as Types.ObjectId, {
          $pull: { friendRequests: new Types.ObjectId(requesterId) }
        })
        await SocketService.notifyFriendRequestRejected(user._id as string, requesterId)
      } else {
        const requester = await UserModel.findById(requesterId)
        if (!requester) throw ApiError.BadRequest('User not found')

        if (!requester.friendRequests.includes(user._id as Types.ObjectId)) {
          throw ApiError.BadRequest('Friend request not found')
        }

        await UserModel.findByIdAndUpdate(requesterId, {
          $pull: { friendRequests: user._id }
        })
        await SocketService.notifyFriendRequestRejected(requesterId, user._id as string)
      }
    } catch (error) {
      console.error('Reject friend error:', error)
      throw error
    }
  }  
  
  async getFriends(authHeader: string, page: number, limit: number) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
    
    const user = await UserModel.findOne({ email: userData.email })
      .select('friends')
      .populate({
        path: 'friends',
        select: 'name surname nickname avatar',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      })

    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    return {
      hasMore: user.friends.length > page * limit,
      data: user.friends
    }
  }

  async getFriendRequests(authHeader: string, page: number, limit: number) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
    
    const user = await UserModel.findOne({ email: userData.email })
      .select('friendRequests')
      .populate({
        path: 'friendRequests',
        select: 'name surname nickname avatar',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      })

    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    return {
      hasMore: user.friendRequests.length > page * limit,
      data: user.friendRequests
    }
  }

  async getBlockedUsers(authHeader: string, page: number, limit: number) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
    
    const user = await UserModel.findOne({ email: userData.email })
      .select('blockedUsers')
      .populate({
        path: 'blockedUsers',
        select: 'name surname nickname avatar',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      })

    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    return {
      hasMore: user.blockedUsers.length > page * limit,
      data: user.blockedUsers
    }
  }
  async getAllPhotos(authHeader: string, id: string, page: number, limit: number) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
    
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
    
    const user = await UserModel.findById(id)
      .select('photos')
      .populate({
        path: 'photos',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      })

    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    return {
      total: user.photos.length,
      page,
      data: user.photos
    }
  }

  async deleteFriend(authHeader: string, requesterId: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)

    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })
    if (!user) throw ApiError.BadRequest('Пользователь не найден')
    
    if (!user.friends.some(id => id.toString() == requesterId.toString())) throw ApiError.BadRequest('Друг не найден')

    await UserModel.findByIdAndUpdate(user._id as Types.ObjectId, {
      $pull: { friends: requesterId }
    })

    await UserModel.findByIdAndUpdate(requesterId, {
      $pull: { friends: user._id }
    })

    await SocketService.notifyFriendDeleted(user._id as string, requesterId)
  }
  
  async getUserPrivacy(authHeader: string) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)

    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findOne({ email: userData.email })
    if (!user) throw ApiError.BadRequest('Пользователь не найден')

    const settings = await SettingsModel.findOne({ user: user._id }).select("avatar posts photos friends")

    if (!settings) {
      const newSettings = await SettingsModel.create({
        user: user._id,
        avatar: 'Все',
        posts: 'Все',
        photos: 'Все',
        friends: 'Все'
      })
      await UserModel.findOneAndUpdate({ _id: user._id }, { settings: newSettings._id })
      return {
        avatar: 'Все',
        posts: 'Все',
        photos: 'Все',
        friends: 'Все'
      }
    }

    return settings
  }  
  async updateUserPrivacy(authHeader: string, settings: IPrivacySettings) {
    if (!authHeader) throw ApiError.UnauthorizedError()
    const userData = await tokenService.validateRefreshToken(authHeader)
  
    if (typeof userData !== 'object' || !userData || !('email' in userData)) {
      throw ApiError.UnauthorizedError()
    }
  
    const user = await UserModel.findOne({ email: userData.email })
    if (!user) throw ApiError.BadRequest('Пользователь не найден')
    const settingsFromDB = await SettingsModel.findOneAndUpdate({ user: user._id }, settings, { new: true })

    return settingsFromDB
  }
}

export default new UserService()