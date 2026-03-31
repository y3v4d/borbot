import { NextFunction, Request, Response } from "express";
import DiscordAPI from "../../api/discord";
import UserService from "../../services/user.service";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "../middlewares/authenticate_user.middleware";

class UserController {
    constructor(
        readonly userService: UserService
    ) {}

    user_get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    }
    
    user_guilds_get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user!;

        try {
            console.log(`Getting updated guilds for user ${user.id}...`);
            const guilds = await this.userService.getUserUpdatedGuilds(user);

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