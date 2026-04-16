import { NextFunction, Request, Response } from "express";
import UserService from "../../services/user.service";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "../middlewares/authenticate_user.middleware";

class UserController {
    constructor(
        readonly userService: UserService
    ) {}

    user_get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const session_data = (req.session as any).data;
        if(!session_data) {
            res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path requires session" });
            return;
        }

        let user = req.user!;
        const last_sync = user.last_user_sync || 0;

        try {
            if(Date.now() - last_sync > 15 * 60 * 1000) {
                user = await this.userService.syncUserInfo(user.id, session_data.discord_token);  
            }

            res.send({
                id: user.id,
                avatar: user.avatar,
                discriminator: user.discriminator,
                username: user.username
            });
        } catch(error) {
            next(error);
        }
    }
    
    user_guilds_get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const session_data = (req.session as any).data;
        if(!session_data) {
            res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path requires session" });
            return;
        }

        try {
            const guilds = await this.userService.getUserGuilds(session_data.uid, session_data.discord_token);
            res.send(guilds);
        } catch(error: any) {
            next(error);
        }
    }
}

export default UserController;