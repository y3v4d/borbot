import { NextFunction, Request, Response } from "express";
import UserService from "../../services/user.service";
import Code from "../../shared/code";
import { decryptAccessToken } from "../../shared/utils";
import { IUser } from "../../models/user";
import { HydratedDocument } from "mongoose";

export interface AuthenticatedRequest extends Request {
    user?: HydratedDocument<IUser>
}

export default function AuthenticateUserMiddleware(
    userService: UserService
) {
    return async function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
        console.log("Authenticating user...");
        const TOKEN = req.headers.authorization;
        if(!TOKEN) {
            res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path requires authentication" });
            return;
        }

        try {
            const payload = await decryptAccessToken(TOKEN);

            const user = await userService.getUser(payload.uid);
            if(!user) {
                next({ code: Code.USER_NOT_REGISTERED });
                return;
            }

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
}