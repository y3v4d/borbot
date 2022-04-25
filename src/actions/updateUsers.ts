import { Client, Guild } from "discord.js";
import { readFileSync } from "fs";
import CH from "../api/clickerheroes";
import Action from "../shared/action";

export const UpdateUsers: Action = {
    timeout: 60000 * 60, // hour

    startOnInit: true,
    repeat: true,

    async run(client: Client) {
        console.log("#updateUsers action");

        const info = await CH.getGuildInfo(process.env.UID!, process.env.HASH!);
        const userMap = JSON.parse(readFileSync('data/userMap.json', { encoding: 'utf-8' })) as { [key: string]: string };
        
        const guild = client.guilds.cache.get(process.env.GUILD_ID!)!;
        const clan_members = Object.values(info.guildMembers);

        for(let uid in userMap) {
            try {
                const guild_member = await guild.members.fetch(uid);
                if(!guild_member.manageable) {
                    console.warn(`User with ${uid} couldn't be modified.`);
                    continue;
                }

                const clan_member = clan_members.find(o => o.uid === userMap[uid]);
                if(!clan_member) {
                    console.error(`Clan user with ${userMap[uid]} is isn't in the clan!`);
                    continue;
                }

                guild_member.setNickname(`${clan_member.nickname} [${clan_member.classLevel}]`);
            } catch(error) {
                console.error(`Error fetching user with ${uid} id!\n${error}`);
            }
        }
    }
};