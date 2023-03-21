import { NextFunction, Request, Response } from "express";
import UserService from "../../services/userService";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "../middlewares/authenticateUser.middleware";

const UserController = {
    async user_information_get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        res.send(req.user);
    },
    
    async user_guilds_get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const user = req.user!;

        try {
            const guilds = await UserService.getUserGuilds(user.id);

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