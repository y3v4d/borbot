import logger from "../../shared/logger";
import Action from "../core/action";

const SyncClanUsersAction: Action = {
    name: "sync-clan-users",
    timeout: 5,
    startOnInit: true,
    repeat: true,

    async run(client, guild) {
        const { guildService, clanService } = client;

        const guildMembers = await guildService.getGuildMembers(guild.guild_id);
        const clanUids = guildMembers.map(m => m.clan_uid);

        const clan = await clanService.getClanInformation(guild.user_uid, guild.password_hash);
        if(!clan) {
            throw new Error(`Couldn't fetch clan information`);
        }

        const operations: Promise<any>[] = [];
        for(const member of clan.members) {
            if(!clanUids.includes(member.uid)) {
                logger(`Adding new member ${member.nickname} (${member.uid}) to guild ${guild.guild_id}`);
                operations.push(
                    guildService.addGuildMember(guild.guild_id, member.uid, member)
                );
            } else {
                operations.push(
                    guildService.syncClickerHeroesInfo(guild.guild_id, member.uid, member)
                );
            }
        }

        for(const member of guildMembers) {
            if(clan.members.findIndex(m => m.uid === member.clan_uid) === -1) {
                logger(`Removing member ${member.nickname} (${member.clan_uid}) from guild ${guild.guild_id}`);
                operations.push(
                    guildService.removeGuildMember(guild.guild_id, member.clan_uid)
                );
            }
        }

        await Promise.all(operations);
    }
};

export default SyncClanUsersAction;