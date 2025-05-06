interface IErrorDetail {
    message: string;
    status: number;
    errors?: any[];
    email?: string;
    name?: string;
	surname?: string
	nickname?: string;
}

export class ApiError extends Error {
	status: number
	errors: IErrorDetail[]
  
	constructor(status: number, message: string, errors: IErrorDetail[] = []) {
        super(message)
        this.status = status
        this.errors = errors
        Object.setPrototypeOf(this, ApiError.prototype)
	}
  
	static BadRequest(message: string, errors: IErrorDetail[] = []) {
        console.log(message, errors)
	    return new ApiError(400, message, errors);
	}
  
	static UnauthorizedError() {
		return new ApiError(401, 'Пользователь не авторизован')
	}

	static UnactivatedError(email: string, name: string, surname: string, nickname: string) {
        return new ApiError(403, 'Пользователь не авторизован', [
            { message: 'Unactivated user', status: 403, email, name, surname, nickname }
        ]);
    }
}