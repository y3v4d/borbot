import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/types/guild.types";
import { alignCycleStart, dateToString } from "../../shared/utils";
import { ChannelType } from "discord.js";
import logger from "../../shared/logger";

export const UpdateSchedule: Action = {
    name: "update-schedule",
    timeout: 5,
    startOnInit: true,
    repeat: true,

    run: async function(bot: Bot, guild: IGuild) {
        if(!guild.schedule || !guild.schedule.channel || !guild.schedule.channel.valid || !guild.schedule.cycle_start || !guild.schedule.list) {
            logger(`Guild ${guild.guild_id} doesn't have schedule channel configured, skipping...`);
            return;
        }

        const { guildService, clanService } = bot;

        const fetched = await bot.getCachedGuild(guild.guild_id);
        if(!fetched) {
            throw new Error(`Couldn't fetch discord server`);
        }

        const channel = await bot.getCachedGuildChannel(fetched, guild.schedule.channel.id);
        if(!channel || channel.type !== ChannelType.GuildText) {
            await guildService.invalidateDiscordChannel(guild.guild_id, guild.schedule.channel.id);
            throw new Error(`Couldn't fetch discord channel ${guild.schedule.channel.id}`);
        }

        const raid = await clanService.getClanNewRaid(guild.user_uid, guild.password_hash, guild.clan_name);
        if(!raid) {
            throw new Error(`Couldn't fetch raid information`);
        }
        
        const MS_IN_DAY = 86400000;
        const CYCLE_LENGTH = 10;

        const cycle_start = alignCycleStart(guild.schedule.cycle_start, CYCLE_LENGTH);
        const cycle_last_day = new Date(cycle_start.getTime() + MS_IN_DAY * (CYCLE_LENGTH - 1));

        const allFightsCompleted = raid.isSuccessful && raid.isBonusSuccessful;

        let message = `:calendar_spiral: **SCHEDULE ${dateToString(cycle_start, 'M.D')}-${dateToString(cycle_last_day, 'M.D')}** :calendar_spiral:\n\n`;
        for(let i = 0; i < guild.schedule.list.length; ++i) {
            const date = new Date(cycle_start.getTime() + MS_IN_DAY * i);
            const time_difference = Date.now() - date.getTime();

            const is_past = time_difference >= MS_IN_DAY;
            const is_today = time_difference >= 0 && !is_past;

            const prefix = is_past || (is_today && allFightsCompleted) ? "~~" : is_today && !allFightsCompleted ? "**" : "";

            message += `${prefix}${dateToString(date, 'M.D')} -> `;

            const entry = guild.schedule.list[i];
            if(!entry) {
                message += `Anyone${prefix}\n`;
                continue;
            }

            const member = await guildService.getGuildMemberByClanUID(guild.guild_id, entry);
            if(!member) {
                throw new Error(`Couldn't find member with id ${entry.toString()}`);
            }

            message += `${member.nickname}${prefix}\n`;
        }

        const channel_message_id = guild.schedule.message_id || "";
        if(channel_message_id && channel_message_id.length > 0) {
            await channel.messages.edit(channel_message_id, message);
            return;
        }

        const sent_message = await channel.send(message);
        await guildService.setGuildSchedule(guild.guild_id, { message_id: sent_message.id });
    }
}