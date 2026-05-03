import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/types/guild.types";
import { dateDifference, dateToString, getDateMidnight } from "../../shared/utils";
import { ChannelType } from "discord.js";
import { IMember } from "../../models/types/member.types";
import logger from "../../shared/logger";
import { ClanClass } from "../../services/clan.service";

export const RemindClaim: Action = {
    name: "remind-claim",
    timeout: 5,
    startOnInit: true,
    repeat: true,

    run: async function(bot: Bot, guild: IGuild) {
        if(!guild.remind || !guild.remind.channel || !guild.remind.channel.valid) {
            logger(`Guild ${guild.guild_id} doesn't have remind channel configured, skipping...`);
            return;
        }

        const { guildService, clanService } = bot;

        const lastReminded = (guild.remind.last_update ? guild.remind.last_update : new Date("2000-01-01"));
        const currentDate = new Date(Date.now());

        // return if the same day or isn't past 11pm
        if(Math.floor(dateDifference(currentDate, lastReminded)) === 0 || currentDate.getUTCHours() !== 23) {
            return;
        }

        const fetchedGuild = await bot.getCachedGuild(guild.guild_id);
        if(!fetchedGuild) {
            throw new Error(`Couldn't fetch discord server`);
        }

        const raid = await clanService.getClanNewRaid(guild.user_uid, guild.password_hash, guild.clan_name);
        if(!raid) {
            throw new Error(`Couldn't fetch raid information`);
        }

        const channel = await bot.getCachedGuildChannel(fetchedGuild, guild.remind.channel.id);
        if(!channel || channel.type !== ChannelType.GuildText) {
            await guildService.invalidateDiscordChannel(guild.guild_id, guild.remind.channel.id);
            throw new Error(`Couldn't fetch discord channel ${guild.remind.channel.id}`);
        }

        const members = await guildService.getGuildMembers(guild.guild_id);

        const missing = members.filter(value => 
            raid!.scores.findIndex(o => o.uid === value.clan_uid) === -1
        );

        const missingBonus = members.filter(value => 
            raid!.bonusScores.findIndex(o => o.uid === value.clan_uid) === -1
        );

        await guildService.setGuildRemind(guild.guild_id, { last_update: getDateMidnight(currentDate) });

        // return if everyone collected
        if(missing.length === 0 && missingBonus.length === 0) {
            return;
        }

        let msg = `:coin: **RAID REMINDER ${dateToString(currentDate)}** :coin:\n\n`;
        if(!raid!.isSuccessful) {
            msg += ":crossed_swords: FIRST RAID NOT COMPLETED :crossed_swords:\n\n"
        } else if(missing.length > 0) {
            msg += composeRemainder(missing, ":crossed_swords: FIRST RAID :crossed_swords:");
            msg += '\n';
        }
        
        if(!raid!.isBonusSuccessful) {
            msg += "**:gem: BONUS RAID NOT COMPLETED :gem:**\n\n";
        } else if(missingBonus.length > 0) {
            msg += composeRemainder(missingBonus, ":gem: BONUS RAID :gem:");
            msg += '\n';
        }

        msg += "**WARNING!** *Everyone mentioned, you have less than 1 hour to claim the rewards!*";

        await channel.send(msg);
    }
}

function composeRemainder(members: IMember[], title: string) {
    let msg = `**${title}**\n`;

    for(const member of members) {
        msg += '- ';

        msg += (member.discord ? `<@${member.discord.user_id}>` : `**${member.nickname}**`);
        msg += ` the **${ClanClass[member.role] || "Unknown"}**\n`;
    }

    return msg;
}