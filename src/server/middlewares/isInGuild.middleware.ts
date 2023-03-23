import { NextFunction, Response } from "express";
import UserService from "../../services/userService";
import { IUserGuild } from "../../models/user";
import Code from "../../shared/code";
import { AuthenticatedRequest } from "./authenticateUser.middleware";

export interface IsInGuildRequest extends AuthenticatedRequest {
    guild?: IUserGuild
}

export default async function IsInGuild(req: IsInGuildRequest, res: Response, next: NextFunction) {
    const guild_id = req.params.id;
    const user = req.user!;

    try {
        const guilds = await UserService.getUserUpdatedGuilds(user);
        if(!guilds) {
            return res.status(403).send({
                code: Code.USER_NOT_REGISTERED, 
                message: `Invalid user` 
            });
        }
        
        const guild = guilds.find(o => o.id === guild_id);
        if(!guild) {
            res.status(404).send({ code: Code.USER_NOT_IN_GUILD, message: "Not in the guild" });
            return;
        } else if(!guild.isAdmin) {
            res.status(404).send({ code: Code.USER_NOT_AN_ADMIN, message: "Required admin permissions" });
            return;
        }

        req.guild = guild;

        next();
    } catch(error: any) {
        if(error.code === Code.USER_NOT_REGISTERED) {
            res.status(401).send(error);
            return;
        }

        next(error);
    }
}