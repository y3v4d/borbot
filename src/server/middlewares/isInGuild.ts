import { NextFunction, Request, Response } from "express";
import { GuildMember } from "discord.js";
import UserService from "../../services/userService";
import { IUserGuild } from "../../models/user";
import Code from "../../shared/code";

export interface IsInGuildRequest extends Request {
    guild?: IUserGuild,
    member?: GuildMember
}

export default async function IsInGuild(req: IsInGuildRequest, res: Response, next: NextFunction) {
    const guild_id = req.params.id;
    const token = req.headers.authorization;
    if(!token) {
        res.status(401).send({ code: Code.USER_NO_TOKEN, message: "Path required authorization"});
        return;
    }

    try {
        const guilds = await UserService.getUserGuilds(token);
        
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