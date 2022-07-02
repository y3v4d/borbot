import { readFileSync } from "fs";
import Bot from "../core/bot";
import Action from "../core/action";
import MemberModel from "../models/member";
import GuildModel from "../models/guild";
import { ClanManager } from "../shared/clan";
import logger, { LoggerType } from "../shared/logger";

export const UpdateUsers: Action = {
    timeout: 60000 * 60, // hour

    startOnInit: true,
    repeat: true,

    async run(client: Bot) {
        const allGuilds = await GuildModel.find();
        for(const guild of allGuilds) {
            const fetched = await client.guilds.fetch(guild.guild_id)!;
            
            const clanManager = new ClanManager(guild.user_uid, guild.password_hash);
            await clanManager.update();

            const members = await MemberModel.find({ guild_id: guild.guild_id });
            for(const member of members) {
                const clanMember = clanManager.getMemberByUid(member.clan_uid)!;
                if(!clanMember) {
                    logger(`#updateUsers Clan member ${member.clan_uid} doesn't exist!`, LoggerType.ERROR);
                    continue;
                }

                const dcMember = await fetched.members.fetch(member.guild_uid)!;
                if(dcMember.manageable) {
                    await dcMember.setNickname(`${clanMember.nickname} [${clanMember.level}]`);
                } else {
                    logger(`#updateUsers User ${dcMember.nickname} couldn't be updated!`, LoggerType.WARN);
                }
            }
        }
    }
};