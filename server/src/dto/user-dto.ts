import { IUser } from '../models/user-model'

export default class UserDto {
    surname: string
    name: string
    nickname: string
    email: string
    id: string
    avatar: string
  
    constructor(model: IUser) { 
      this.surname = model.surname
      this.name = model.name
      this.nickname = model.nickname
      this.email = model.email
      this.id = model._id!.toString()
      this.avatar = "http://192.168.0.54:3000/" + model.avatar || ''
    }
  }