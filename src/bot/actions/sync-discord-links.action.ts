import { GuildMember } from "discord.js";
import { IMember } from "../../models/types/member.types";
import logger from "../../shared/logger";
import Action from "../core/action";

const SyncDiscordLinksAction: Action = {
    name: "sync-discord-links",
    timeout: 5,
    startOnInit: true,
    repeat: true,

    async run(client, guild) {
        const { guildService } = client;

        const guildMembers = await guildService.getGuildMembers(guild.guild_id);
        
        const toUnlink: Set<string> = new Set();
        const toUpdate: { member: IMember, discord: GuildMember }[] = [];

        for(const member of guildMembers) {
            if(member.discord) {
                const discordMember = await client.getCachedGuildMember(guild.guild_id, member.discord.user_id);
                if(!discordMember) {
                    toUnlink.add(member.discord.user_id);
                } else if(discordMember.user.username !== member.discord.username || discordMember.user.avatar !== member.discord.avatar) {
                    toUpdate.push({ member, discord: discordMember });
                }
            }
        }

        const updated_discord_ids: Set<string> = new Set();
        for(const { member, discord } of toUpdate) {
            if(updated_discord_ids.has(discord.user.id)) {
                continue;
            }

            try {
                await guildService.syncAllDiscordLink(discord.user.id, {
                    username: discord.user.username,
                    avatar: discord.user.avatar
                });

                updated_discord_ids.add(discord.user.id);
            } catch(error) {
                logger(`Error updating discord link for guild ${guild.guild_id} and member ${member.clan_uid}: ${(error as Error).message}`, "ERROR");
            }
        }

        if(toUnlink.size > 0) {
            logger(`Removing ${toUnlink.size} invalid discord links for guild ${guild.guild_id}: ${Array.from(toUnlink).join(", ")}`, "INFO");

            try {
                await guildService.removeAllDiscordLinks(Array.from(toUnlink));
            } catch(error) {
                logger(`Error removing discord links for guild ${guild.guild_id}: ${(error as Error).message}`, "ERROR");
            }
        }
    }
};

export default SyncDiscordLinksAction;