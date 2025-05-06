import 'dotenv/config'
import nodemailer from 'nodemailer'

class mailService {
	transporter: nodemailer.Transporter

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: +process.env.SMTP_PORT!,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			}
		})
	}

	async sendActivationMail(email: string, link: string) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: `Активация аккаунта на ${process.env.CLIENT_URL}`,
                text: '',
                html: (`
                    <div style="
                        background: linear-gradient(135deg, #445b73, #749bb8);
                        color: white;
                        padding: 20px;
                        border-radius: 10px;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    ">
                        <h1 style="margin-bottom: 10px;">Добро пожаловать!</h1>
                        <p style="font-size: 16px;">Благодарим вас за регистрацию на нашем сайте.</p>
                        <p style="font-size: 16px;">Для завершения процесса регистрации и активации аккаунта, подтвердите вашу электронную почту.</p>
                        <a href="${link}" style="
                            display: inline-block;
                            background: #ffffff33;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 5px;
                            text-decoration: none;
                            font-size: 16px;
                            font-weight: bold;
                            margin-top: 10px;
                        ">Активировать аккаунт</a>
                        <p style="margin-top: 20px; font-size: 14px;">Если кнопка не работает, скопируйте и вставьте ссылку в браузер:</p>
                        <p style="word-wrap: break-word; font-size: 14px;">${link}</p>
                        <p style="margin-top: 20px; font-size: 14px;">Спасибо за то, что выбрали нас!</p>
                    </div>
                `)
            });
        } catch (err) {
            console.error('Ошибка при отправке email:', err);
            throw err;
        }
    }
}

export default new mailService()