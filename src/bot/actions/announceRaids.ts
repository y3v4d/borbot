import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/guild";
import logger, { LoggerType } from "../../shared/logger";
import ClanService from "../../services/clanService";
import { HydratedDocument } from "mongoose";
import GuildService from "../../services/guildService";
import { dateDifference, dateToString, getDateMidnight } from "../../shared/utils";
import { roleMention, userMention } from "@discordjs/builders";
import { ChannelType } from "discord.js";

function composeMessage(mention: string, date: Date, msg: string) {
    return `${mention} **${dateToString(date)}**\n**${msg}**`;
}

export const AnnounceRaids: Action = {
    run: async function(client: Bot, guild: HydratedDocument<IGuild>) {
        const fetched = client.guilds.cache.get(guild.guild_id);
        if(!fetched) {
            logger(`#announceRaids Couldn't find guild with id ${guild.guild_id}`);
            return;
        }

        const clan = await ClanService.getClanInformation(guild.user_uid, guild.password_hash);
        if(!clan) {
            logger(`#announceRaids Invalid clan information`, LoggerType.ERROR);
            return;
        }
        const raid = await ClanService.getClanNewRaid(guild.user_uid, guild.password_hash, clan!.name);

        const channel = fetched.channels.cache.get(guild.raid_announcement_channel || "");
        if(!channel || channel.type !== ChannelType.GuildText) {
            logger("#announceRaids Invalid channel for raid announcements!", LoggerType.WARN);
            return;
        }

        const schedule = await GuildService.getGuildSchedule(guild.guild_id);
        if(!schedule) {
            logger("#announceRaids Schedule wasn't setup!", LoggerType.WARN);
            return;
        }

        const currentDate = getDateMidnight();
        const checkedToday = schedule.last_checked && schedule.last_checked.getTime() === currentDate.getTime();

        if(!checkedToday) {
            const diff = dateDifference(currentDate, schedule.cycle_start);

            if(diff >= 10 || diff < 0) {
                const cycles = Math.floor(diff / 10);
                const newCycleTimestamp = schedule.cycle_start.getTime() + (cycles * 86400000 * 10);

                schedule.cycle_start = new Date(newCycleTimestamp);
            }

            // reset all values if didn't check today
            schedule.last_checked = currentDate;
            schedule.loggedRaidSuccess = false;
            schedule.loggedBonusRaidAvailable = false;
            schedule.loggedBonusRaidSuccess = false;

            await channel.send(composeMessage(
                guild.raid_fight_role ? roleMention(guild.raid_fight_role) : "@everyone",
                currentDate,
                `First raid available! :crossed_swords:`
            ));
        }

        if(!schedule.loggedRaidSuccess && raid!.isSuccessful) {
            schedule.loggedRaidSuccess = true;

            let uid = "";

            const cycleDay = dateDifference(currentDate, schedule.cycle_start);
            const scheduleMember = schedule.map.find(o => o.index === (cycleDay + 1));
            if(scheduleMember && scheduleMember.member) {
                uid = scheduleMember.member.guild_uid;
            }

            await channel.send(composeMessage(
                uid ? userMention(uid) : "@everyone",
                currentDate,
                'You can buy the bonus fight now! :coin:'
            ));
        }

        if(!schedule.loggedBonusRaidAvailable && raid!.isBonusAvailable) {
            schedule.loggedBonusRaidAvailable = true;

            await channel.send(composeMessage(
                guild.raid_fight_role ? roleMention(guild.raid_fight_role) : "@everyone",
                currentDate,
                `Second raid available! :crossed_swords:`
            ));
        }

        if(!schedule.loggedBonusRaidSuccess && raid!.isBonusSuccessful) {
            schedule.loggedBonusRaidSuccess = true;

            await channel.send(composeMessage(
                guild.raid_claim_role ? roleMention(guild.raid_claim_role) : "@everyone",
                currentDate,
                `All fights completed! Collect your rewards! :gem:`
            ));
        }

        await schedule.save();
        
        logger(`#announceRaids in ${fetched.name}`);
    },

    startOnInit: true,
    timeout: 5,
    repeat: true
}