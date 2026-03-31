import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/guild";
import logger, { LoggerType } from "../../shared/logger";
import { ClanClass, ClanMember } from "../../services/clan.service";
import GuildService from "../../services/guild.service";
import { HydratedDocument } from "mongoose";
import { dateDifference, dateToString, getDateMidnight } from "../../shared/utils";
import { ChannelType } from "discord.js";

async function composeRemainder(guildService: GuildService, guild_id: string, members: ClanMember[], title: string) {
    let msg = `**${title}**\n`;

    for(const member of members) {
        msg += '- ';

        const dbMember = await guildService.getGuildMemberByClanUID(guild_id, member.uid);
        if(!dbMember) console.log('didnt dint');
        msg += (dbMember ? `<@${dbMember.guild_uid}>` : member.nickname);
        msg += ` **The ${ClanClass[member.class]}**\n`;
    }

    return msg;
}

export const RemindClaim: Action = {
    run: async function(client: Bot, guild: HydratedDocument<IGuild>) {
        const { guildService, clanService } = client;

        const fetchedGuild = client.client.guilds.cache.get(guild.guild_id);
        if(!fetchedGuild) {
            logger(`#remindClaim Couldn't get guild ${guild.guild_id}`);
            return;
        }

        const lastReminded = (guild.last_reminded === undefined ? new Date("2000-01-01") : guild.last_reminded);
        const currentDate = new Date(Date.now());

        // return if the same day or isn't past 11pm
        if(Math.floor(dateDifference(currentDate, lastReminded)) === 0 || currentDate.getUTCHours() !== 23) return;

        const clan = await clanService.getClanInformation(guild.user_uid, guild.password_hash);
        if(!clan) {
            logger(`#remindClaim Invalid clan information`, LoggerType.ERROR);
            return;
        }
        const raid = await clanService.getClanNewRaid(guild.user_uid, guild.password_hash, clan!.name);

        const channel = await fetchedGuild.channels.cache.get(guild.remind_channel || "");
        if(!channel || channel.type !== ChannelType.GuildText) {
            logger(`#remindClaim Couldn't get valid channel`, LoggerType.WARN);
            return;
        }

        const missing = clan!.members.filter(value => 
            raid!.scores.findIndex(o => o.uid === value.uid) === -1
        );

        const missingBonus = clan!.members.filter(value => 
            raid!.bonusScores.findIndex(o => o.uid === value.uid) === -1
        );

        guild.last_reminded = getDateMidnight(currentDate);

        // return if everyone collected
        if(missing.length === 0 && missingBonus.length === 0) return;

        let msg = `:coin: **RAID REMINDER ${dateToString(currentDate)}** :coin:\n\n`;
        if(!raid!.isSuccessful) {
            msg += ":crossed_swords: FIRST RAID NOT COMPLETED :crossed_swords:\n\n"
        } else if(missing.length > 0) {
            msg += await composeRemainder(guildService, guild.guild_id, missing, ":crossed_swords: FIRST RAID :crossed_swords:");
            msg += '\n';
        }
        
        if(!raid!.isBonusSuccessful) {
            msg += "**:gem: BONUS RAID NOT COMPLETED :gem:**\n\n";
        } else if(missingBonus.length > 0) {
            msg += await composeRemainder(guildService, guild.guild_id, missingBonus, ":gem: BONUS RAID :gem:");
            msg += '\n';
        }

        msg += "**WARNING!** *Everyone mentioned, you have less then 1 hour to claim the rewards!*";

        await channel.send(msg);

        logger(`#remindClaim in ${fetchedGuild.name}`);
    },

    startOnInit: true,
    repeat: true,

    timeout: 5
}