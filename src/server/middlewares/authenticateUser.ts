import { NextFunction, Request, Response } from "express";
import UserService from "../../services/userService";
import Code from "../../shared/code";
import DiscordAPI from "../../api/discord";

export interface AuthenticatedRequest extends Request {
    user?: DiscordAPI.UserInformationResponse
}

export default async function AuthenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const TOKEN = req.headers.authorization;
    if(!TOKEN) {
        res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path requires authentication" });
        return;
    }

    try {
        const user = await UserService.getUserInformation(TOKEN);
        req.user = user;

        next();
    } catch(error: any) {
        if(error.code === Code.USER_NOT_REGISTERED) {
            res.status(401).send(error);
            return;
        }

        next(error);
    }
}