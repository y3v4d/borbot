import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/guild";
import logger, { LoggerType } from "../../shared/logger";
import ClanService from "../../services/clanService";
import { HydratedDocument } from "mongoose";
import GuildService from "../../services/guildService";
import { dateToString } from "../../shared/utils";

export const UpdateSchedule: Action = {
    run: async function(client: Bot, guild: HydratedDocument<IGuild>) {
        const fetched = await client.guilds.cache.get(guild.guild_id);
        if(!fetched) {
            logger(`#updateSchedule Couldn't get guild with id: ${guild.guild_id}`);
            return;
        }

        logger(`#updateSchedule in ${fetched.name}`);

        const schedule = await GuildService.getGuildSchedule(guild.guild_id);
        if(!schedule) {
            logger("#updateSchedule Schedule wasn't setup!", LoggerType.WARN);
            return;
        }

        const channel_message_id = schedule.schedule_message_id || "";
        const channel_id = schedule.schedule_channel || "";
        if(!channel_id || channel_id.length === 0) {
            logger(`#updateSchedule No schedule channel assigned`);
            return;
        }

        const channel = await fetched.channels.cache.get(channel_id);
        if(!channel || !channel.isText()) {
            logger("#updateSchedule Couldn't find schedule channel!", LoggerType.WARN);
            return;
        }

        const clan = await ClanService.getClanInformation(guild.user_uid, guild.password_hash);
        const raid = await ClanService.getClanNewRaid(guild.user_uid, guild.password_hash, clan!.name);

        const MS_IN_DAY = 86400000;

        const cycle_end = new Date(schedule.cycle_start.getTime() + MS_IN_DAY * 9);
        const allFightsCompleted = raid!.isSuccessful && raid!.isBonusSuccessful;

        let message = `:calendar_spiral: **SCHEDULE ${dateToString(schedule.cycle_start)}-${dateToString(cycle_end)}** :calendar_spiral:\n\n`;
        for(let i = 0; i < 10; ++i) {
            const date = new Date(schedule.cycle_start.getTime() + MS_IN_DAY * i);
            const time_difference = Date.now() - date.getTime();

            const is_past = time_difference >= MS_IN_DAY;
            const is_today = time_difference >= 0 && !is_past;

            const prefix = is_past || (is_today && allFightsCompleted) ? "~~" : is_today && !allFightsCompleted ? "**" : "";

            message += `${prefix}${dateToString(date)} -> `;

            const entry = schedule.map.find(o => o.index === i + 1);
            if(!entry) {
                message += `Anyone${prefix}\n`;
                continue;
            }

            const member = clan!.members.find(o => o.uid === entry.member.clan_uid);
            if(!member) {
                message += `Anyone${prefix}\n`;
                logger(`#updateSchedule Couldn't find clan member with uid ${entry.member.clan_uid}!`, LoggerType.WARN);

                continue;
            }

            message += `${member.nickname}${prefix}\n`;
        }

        if(channel_message_id && channel_message_id.length > 0) {
            try {
                const fetched_message = await channel.messages.fetch(channel_message_id);
                await fetched_message.edit(message);

                return;
            } catch(error: any) {
                logger(`No fetched message associated with id ${channel_message_id}`, LoggerType.WARN);
            }
        }

        const sent_message = await channel.send(message);
        schedule.schedule_message_id = sent_message.id;

        await schedule.save();
    },

    startOnInit: true,
    timeout: 5,
    repeat: true
}