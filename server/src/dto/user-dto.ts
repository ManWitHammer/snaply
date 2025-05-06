import { IUser } from '../models/user-model'

export default class UserDto {
    surname: string
    name: string
    nickname: string
    email: string
    id: string
    avatar: string
    description: string
    isActivated: boolean
  
    constructor(model: IUser) { 
      this.surname = model.surname
      this.name = model.name
      this.nickname = model.nickname
      this.email = model.email
      this.id = model._id!.toString()
      this.avatar = model.avatar ? model.avatar : ''
      this.description = model.description ? model.description : ''
      this.isActivated = model.isActivated
    }
  }