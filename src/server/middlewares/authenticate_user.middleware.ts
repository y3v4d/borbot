import { NextFunction, Request, Response } from "express";
import UserService from "../../services/user.service";
import Code from "../../shared/code";
import { IUser } from "../../models/user";

export interface AuthenticatedRequest extends Request {
    user?: IUser
}

export default function AuthenticateUserMiddleware(
    userService: UserService
) {
    return async function (req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const session_data = (req.session as any).data;
        if(!session_data) {
            res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path requires session" });
            return;
        }

        try {
            const user = await userService.getUser(session_data.uid);
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