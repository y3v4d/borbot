import { NextFunction, Request, Response } from "express";
import DiscordAPI from "../../api/discord";
import UserService from "../../services/userService";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "../middlewares/authenticateUser.middleware";

const UserController = {
    async user_get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const user = req.user!;

        try {
            const info = await DiscordAPI.getUserInformation(user.token);
        
            res.send({
                id: user.id,
                avatar: info.avatar,
                discriminator: info.discriminator,
                username: info.username,
                guilds: user.guilds || []
            });
        } catch(error) {
            next(error);
        }
    },
    
    async user_guilds_get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const user = req.user!;

        try {
            const guilds = await UserService.getUserUpdatedGuilds(user);

            res.send(guilds);
        } catch(error: any) {
            if(error.code === Code.USER_NOT_REGISTERED) {
                res.status(401).send(error);
                return;
            }

            next(error);
        }
    }
}

export default UserController;