import { NextFunction, Request, Response } from "express";
import UserService from "../../services/userService";
import Code from "../../shared/code";

const UserController = {
    async getUserInformation(req: Request, res: Response, next: NextFunction) {
        const TOKEN = req.headers.authorization!;
    
        try {
            const data = await UserService.getUserInformation(TOKEN);
            res.send(data);
        } catch(error: any) {
            if(error.code === Code.USER_NOT_REGISTERED) {
                res.status(401).send(error);
                return;
            }

            next(error);
        }
    },
    
    async getUserGuilds(req: Request, res: Response, next: NextFunction) {
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