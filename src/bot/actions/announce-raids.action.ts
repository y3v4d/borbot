import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/types/guild.types";
import logger, { LoggerType } from "../../shared/logger";
import { alignCycleStart, dateDifference, dateToString, getDateMidnight } from "../../shared/utils";
import { roleMention, userMention } from "@discordjs/builders";
import { ChannelType } from "discord.js";

export const AnnounceRaids: Action = {
    name: "announce-raids",
    timeout: 5,
    startOnInit: true,
    repeat: true,

    run: async function(bot: Bot, guild: IGuild) {
        if(!guild.raid || !guild.raid.channel || !guild.raid.channel.valid) {
            logger(`Guild ${guild.guild_id} doesn't have raid channel configured, skipping...`, LoggerType.WARN);
            return;
        }

        const { guildService, clanService } = bot;

        const fetched = await bot.getCachedGuild(guild.guild_id);
        if(!fetched) {
            throw new Error(`Couldn't fetch discord server`);
        }

        const raid = await clanService.getClanNewRaid(guild.user_uid, guild.password_hash, guild.clan_name);
        if(!raid) {
            throw new Error(`Couldn't fetch raid information`);
        }

        const channel = await bot.getCachedGuildChannel(fetched, guild.raid.channel.id);
        if(!channel || channel.type !== ChannelType.GuildText) {
            await guildService.invalidateDiscordChannel(guild.guild_id, guild.raid.channel.id);
            throw new Error(`Couldn't fetch discord channel ${guild.raid.channel.id}`);
        }

        const update: any = {};
        let status = guild.raid.status || 0;

        const currentDate = getDateMidnight();
        const checkedToday = guild.raid.last_update && guild.raid.last_update.getTime() === currentDate.getTime();

        if(!checkedToday) {
            update.status = 0;
            status = 0;

            await channel.send(composeMessage(
                guild.raid.fight_role ? roleMention(guild.raid.fight_role.id) : "@everyone",
                currentDate,
                `First raid available! :crossed_swords:`
            ));
        }

        if(status === 0 && raid.isSuccessful) {
            update.status = 1;
            status = 1;

            let mention = "@everyone";

            if(guild.schedule && guild.schedule.cycle_start) {
                const cycle_start = alignCycleStart(guild.schedule.cycle_start, 10);
                const cycleDay = dateDifference(currentDate, cycle_start);
                const clanUID = guild.schedule.list[cycleDay];
                
                if(clanUID) {
                    const member = await guildService.getGuildMemberByClanUID(guild.guild_id, clanUID);

                    if(!member) {
                        logger(`#announceRaids Couldn't find member with id ${clanUID.toString()}`, LoggerType.WARN);
                    } else {
                        if(member.discord) {
                            mention = userMention(member.discord.user_id);
                        } else {
                            mention = `**${member.nickname}**`;
                        }
                    }
                }
            } else {
                logger(`#announceRaids Guild ${guild.guild_id} doesn't have schedule configured, mentioning everyone`, LoggerType.WARN);
            }

            await channel.send(composeMessage(
                mention,
                currentDate,
                'You can buy the bonus fight now! :coin:'
            ));
        }

        if(status == 1 && raid.isBonusAvailable) {
            update.status = 2;
            status = 2;

            await channel.send(composeMessage(
                guild.raid.fight_role ? roleMention(guild.raid.fight_role.id) : "@everyone",
                currentDate,
                `Second raid available! :crossed_swords:`
            ));
        }

        if(status == 2 && raid.isBonusSuccessful) {
            update.status = 3;
            status = 3;

            await channel.send(composeMessage(
                guild.raid.claim_role ? roleMention(guild.raid.claim_role.id) : "@everyone",
                currentDate,
                `All fights completed! Collect your rewards! :gem:`
            ));
        }


        update.last_update = currentDate;
        await guildService.setGuildRaid(guild.guild_id, update);
    }
}

function composeMessage(mention: string, date: Date, msg: string) {
    return `${mention} **${dateToString(date)}**\n**${msg}**`;
}