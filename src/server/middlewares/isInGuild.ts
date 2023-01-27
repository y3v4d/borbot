import { NextFunction, Request, Response } from "express";
import { GuildMember } from "discord.js";
import DiscordAPI from "../../api/discord";
import { isAdmin } from "../../shared/utils";

export interface IsInGuildRequest extends Request {
    guild?: any,
    member?: GuildMember
}

export default function IsInGuild(req: IsInGuildRequest, res: Response, next: NextFunction) {
    const guild_id = req.params.id;
    const token = req.headers.authorization;
    if(!token) {
        res.status(403).send({ message: "Path required authorization"});
        return;
    }

    const call = async () => {
        try {
            const data = await DiscordAPI.getUserGuilds(token);
            const guild = data.find(o => o.id === guild_id);
            if(!guild) {
                res.status(404).send({ code: 0, message: "Not in the guild" });
                return;
            } else if(!isAdmin(guild.permissions)) {
                res.status(404).send({ code: 0, message: "Required admin permissions" });
                return;
            }
    
            req.guild = guild;
    
            next();
        } catch(error: any) {
            if(error.status == 429) {
                const retry_after = error.data.retry_after;
                console.log(`Rate limit hit, retrying after ${retry_after}`);

                setTimeout(call, retry_after * 1000);
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, message: error.data.message });
            }
        }
    };

    call();
}