import { readFileSync } from "fs";
import Bot from "../core/bot";
import Action from "../core/action";
import MemberModel from "../models/member";
import GuildModel from "../models/guild";
import { ClanManager } from "../shared/clan";

export const UpdateUsers: Action = {
    timeout: 60000 * 60, // hour

    startOnInit: true,
    repeat: true,

    async run(client: Bot) {
        console.log("#updateUsers action");

        const allGuilds = await GuildModel.find();
        for(const guild of allGuilds) {
            const fetched = await client.guilds.fetch(guild.guild_id)!;
            console.log(`---- Updating in ${fetched.name} ----`);
            
            const clanManager = new ClanManager(guild.user_uid, guild.password_hash);
            await clanManager.update();

            const members = await MemberModel.find({ guild_id: guild.guild_id });
            for(const member of members) {
                const clanMember = clanManager.getMemberByUid(member.clan_uid)!;
                const dcMember = await fetched.members.fetch(member.guild_uid)!;

                if(dcMember.manageable) {
                    await dcMember.setNickname(`${clanMember.nickname} [${clanMember.level}]`);
                    //console.warn(`> User ${dcMember.nickname} updated!`);
                } else {
                    //console.warn(`> User ${dcMember.nickname} couldn't be updated!`);
                }
            }
        }
    }
};