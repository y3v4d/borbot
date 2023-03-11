import { NextFunction, Request, Response } from "express";
import UserService from "../../services/userService";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "../middlewares/authenticateUser.middleware";

const UserController = {
    async user_information_get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const user = req.user!;

        res.send(user);
    },
    
    async user_guilds_get(req: Request, res: Response, next: NextFunction) {
        const TOKEN = req.headers.authorization!;

        try {
            const guilds = await UserService.getUserGuilds(TOKEN);

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