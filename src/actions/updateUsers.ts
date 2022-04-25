import { readFileSync } from "fs";
import Bot from "../core/bot";
import Action from "../core/action";

export const UpdateUsers: Action = {
    timeout: 60000 * 60, // hour

    startOnInit: true,
    repeat: true,

    async run(client: Bot) {
        console.log("#updateUsers action");
        await client.clan.update();

        let userMap: { [key: string]: string } = {};
        try {
            userMap = JSON.parse(readFileSync('data/userMap.json', { encoding: 'utf-8' })) as { [key: string]: string };
        } catch(e) {
            console.warn("data/userMap.json doesn't exists! Creating...");
        }
        
        const guild = client.guilds.cache.get(process.env.GUILD_ID!)!;
        const clan_members = client.clan.getAllMembers();

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

                guild_member.setNickname(`${clan_member.nickname} [${clan_member.level.toString()}]`);
            } catch(error) {
                console.error(`Error fetching user with ${uid} id!\n${error}`);
            }
        }
    }
};