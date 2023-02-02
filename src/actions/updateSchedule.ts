import Bot from "../core/bot";
import Action from "../core/action";
import GuildModel from "../models/guild";
import ScheduleModel from "../models/schedule";
import { ClanManager } from "../shared/clan";
import { IMember } from "../models/member";
import logger, { LoggerType } from "../shared/logger";

function dateToString(date: Date) {
    return `${(date.getUTCDate().toString().padStart(2, '0'))}.${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
}

export const UpdateSchedule: Action = {
    run: async function(client: Bot) {
        const allGuilds = await GuildModel.find();
        for(const guild of allGuilds) {
            const fetched = await client.guilds.cache.get(guild.guild_id);
            if(!fetched) {
                logger(`#updateSchedule Couldn't get guild with id: ${guild.guild_id}`);
                continue;
            }

            logger(`#updateSchedule in ${fetched.name}`);

            const schedule = await ScheduleModel.findOne({ _id: guild.schedule })
                .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
            if(!schedule) {
                logger("#updateSchedule Schedule wasn't setup!", LoggerType.WARN);
                continue;
            }

            const channel_message_id = schedule.schedule_message_id || "";
            const channel_id = schedule.schedule_channel || "";
            if(!channel_id || channel_id.length === 0) {
                logger(`#updateSchedule No schedule channel assigned`);
                continue;
            }
            
            if(!(await ClanManager.test(guild.user_uid, guild.password_hash))) {
                logger("#updateSchedule Couldn't find clan with assigned credentials...", LoggerType.ERROR);
                continue;
            }

            const channel = await fetched.channels.cache.get(channel_id);
            if(!channel || !channel.isText()) {
                logger("#updateSchedule Couldn't find schedule channel!", LoggerType.WARN);
                continue;
            }

            const clan = new ClanManager(guild.user_uid, guild.password_hash);
            await clan.fetchNewRaid();

            const MS_IN_DAY = 86400000;

            const cycle_start = new Date(schedule.start_day);
            const cycle_end = new Date(cycle_start.getTime() + MS_IN_DAY * 9);
            const allFightsCompleted = clan.newRaid!.isSuccessful && clan.newRaid!.isBonusSuccessful;

            let message = `:calendar_spiral: **SCHEDULE ${dateToString(cycle_start)}-${dateToString(cycle_end)}** :calendar_spiral:\n\n`;
            for(let i = 0; i < 10; ++i) {
                const date = new Date(cycle_start.getTime() + MS_IN_DAY * i);
                const time_difference = Date.now() - date.getTime();

                const is_past = time_difference >= MS_IN_DAY;
                const is_today = time_difference >= 0 && !is_past;

                const prefix = is_past || (is_today && allFightsCompleted) ? "~~" : is_today && !allFightsCompleted ? "**" : "";

                message += `${prefix}${dateToString(date)} -> `;

                const entry = schedule.map.find(o => o.index === i + 1);
                if(!entry) {
                    message += 'Noone\n';
                    continue;
                }

                const member = clan.getMemberByUid(entry.member.clan_uid);
                if(!member) {
                    message += 'Noone\n';
                    logger(`#updateSchedule Couldn't find clan member with uid ${entry.member.clan_uid}!`, LoggerType.WARN);

                    continue;
                }

                message += `${member.nickname}${prefix}\n`;
            }

            if(channel_message_id && channel_message_id.length > 0) {
                try {
                    const fetched_message = await channel.messages.fetch(channel_message_id);
                    await fetched_message.edit(message);

                    continue;
                } catch(error: any) {
                    logger(`No fetched message associated with id ${channel_message_id}`, LoggerType.WARN);
                }
            }

            const sent_message = await channel.send(message);
            schedule.schedule_message_id = sent_message.id;

            await schedule.save();
        }
    },

    startOnInit: true,
    timeout: 60000 * 5,
    repeat: true
}