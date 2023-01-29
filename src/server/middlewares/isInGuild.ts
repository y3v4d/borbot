import { NextFunction, Request, Response } from "express";
import { GuildMember } from "discord.js";
import DiscordAPI from "../../api/discord";
import { isAdmin } from "../../shared/utils";
import UserService from "../services/userService";

export interface IsInGuildRequest extends Request {
    guild?: any,
    member?: GuildMember
}

export default async function IsInGuild(req: IsInGuildRequest, res: Response, next: NextFunction) {
    const guild_id = req.params.id;
    const token = req.headers.authorization;
    if(!token) {
        res.status(403).send({ message: "Path required authorization"});
        return;
    }

    const user = await UserService.fetchUser(token);
    if(user.guilds === null) {
        await user.fetchGuilds();
    }

    const guild = user.guilds!.find(o => o.id === guild_id);
    if(!guild) {
        res.status(404).send({ code: 0, message: "Not in the guild" });
        return;
    } else if(!guild.isAdmin) {
        res.status(404).send({ code: 0, message: "Required admin permissions" });
        return;
    }

    req.guild = guild;
    next();
}