import { NextFunction, Response } from "express";
import UserService, { IUserGuild } from "../../services/user.service";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "./authenticate_user.middleware";
import { validate_str, validateParams } from "../../shared/utils";

export interface IsInGuildRequest extends AuthenticatedRequest {
    guild?: IUserGuild
}

export default function IsInGuildMiddleware(
    userService: UserService
) {
    return async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const session_data = (req.session as any).data;
        if(!session_data) {
            res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path requires session" });
            return;
        }

        try {
            const params = await validateParams(req.params, {
                id: { type: validate_str }
            });

            const guilds = await userService.getUserGuilds(session_data.uid, session_data.discord_token);
            if(!guilds) {
                return res.status(403).send({
                    code: Code.USER_NOT_REGISTERED, 
                    message: `Invalid user` 
                });
            }
            
            const guild = guilds.find(o => o.id === params.id);
            if(!guild) {
                return res.status(404).send({ code: Code.USER_NOT_IN_GUILD, message: "Not in the guild" });
            } else if(!guild.isAdmin && !guild.owner) {
                return res.status(404).send({ code: Code.USER_NOT_AN_ADMIN, message: "Required admin permissions" });
            }

            req.guild = guild;

            next();
        } catch(error: any) {
            next(error);
        }
    }
}