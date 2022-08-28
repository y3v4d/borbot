import express from "express";
import MemberModel from "../models/member";
import GuildModel from "../models/guild";
import Bot from "../core/bot";

export default function(client: Bot) {
    const route = express.Router();

    route.post('/getAll', async (req, res) => {
        const pGuildId = req.body.guildId;

        const fetchedGuild = await client.guilds.fetch(pGuildId);
        if(!fetchedGuild) res.json();

        const dbMembers = await MemberModel.find({ guild_id: pGuildId }, { _id: 0, __v: 0});
        if(!dbMembers) res.json();

        const result = [];
        for(const dbMember of dbMembers) {
            const fetchedMember = await fetchedGuild.members.fetch(dbMember.guild_uid);
            if(!fetchedMember) continue;

            result.push({
                guildName: fetchedMember.displayName,
                guildUid: fetchedMember.id,
                
                clanUid: dbMember.clan_uid
            });
        }

        res.json(result);
    });

    return route;
}