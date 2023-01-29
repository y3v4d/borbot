import Bot from "../core/bot";
import Action from "../core/action";
import GuildModel from "../models/guild";
import ScheduleModel, { ISchedule } from "../models/schedule";
import { ClanManager } from "../shared/clan";
import MemberModel from "../models/member";
import logger, { LoggerType } from "../shared/logger";

function dateToString(date: Date) {
    return `${date.getUTCFullYear().toString()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate().toString().padStart(2, '0'))}`;
}

function differenceBetweenDays(self: string, other: string) {
    return Math.round(
        (new Date(self).getTime() - new Date(other).getTime()) /
        86400000 // MS in day
    );
}

function composeMessage(date: string, rank: string, msg: string) {
    return `<@&${rank}> **${date}\n${msg}**`;
}

function composeBonusMessage(date: string, id: string, msg: string) {
    return `<@${id}> **${date}\n${msg}**`;
}

const ANNOUNCEMENTS = '953688933609394217';

const IM_FIGHTERS = '953630949789274154';
const T_HUNTERS = '953631155117248552';

export const AnnounceRaids: Action = {
    run: async function(client: Bot) {
        const allGuilds = await GuildModel.find();
        for(const guild of allGuilds) {
            const fetched = await client.guilds.fetch(guild.guild_id)!;
            logger(`#announceRaids in ${fetched.name}`);
            
            if(!(await ClanManager.test(guild.user_uid, guild.password_hash))) {
                logger("#announceRaids Couldn't find clan with assigned credentials...", LoggerType.ERROR);
                continue;
            }

            const clan = new ClanManager(guild.user_uid, guild.password_hash);
            const raidInfo = await clan.getRaidInfo();

            const channel = await fetched.channels.cache.get(ANNOUNCEMENTS);
            if(!channel) {
                logger("#announceRaids Couldn't find announcements channel!", LoggerType.WARN);
                continue;
            }

            const schedule = (await guild.populate<{ schedule: ISchedule }>('schedule')).schedule;
            if(!schedule) {
                logger("#announceRaids Schedule wasn't setup!", LoggerType.WARN);
                continue;
            }

            const currentDate = dateToString(new Date(Date.now()));

            // check if checked today
            if(!schedule.last_checked || schedule.last_checked != currentDate) {
                const diff = differenceBetweenDays(currentDate, schedule.start_day);

                if(diff >= 10 || diff < 0) {
                    const cycles = Math.floor(diff / 10) * 10;
                    const newCycleTimestamp = new Date(schedule.start_day).getTime() + (cycles * 86400000);
                    schedule.start_day = dateToString(new Date(newCycleTimestamp));

                    logger("#announceRaids New cycle start: " + schedule.start_day);
                }

                // reset all values if didn't check today
                schedule.last_checked = currentDate;
                schedule.loggedRaidSuccess = false;
                schedule.loggedBonusRaidAvailable = false;
                schedule.loggedBonusRaidSuccess = false;

                if(channel.isText()) channel.send(composeMessage(
                    currentDate,
                    IM_FIGHTERS,
                    `First raid available! :crossed_swords:`
                ));
            }

            if(!schedule.loggedRaidSuccess && raidInfo.isSuccessful) {
                schedule.loggedRaidSuccess = true;

                let userToMention = "";

                const cycleDay = differenceBetweenDays(currentDate, schedule.start_day);
                const scheduleMember = schedule.map.find(o => o.index === (cycleDay + 1));
                if(scheduleMember) {
                    const memberId = (await MemberModel.findById(scheduleMember.member))!.guild_uid;
                    userToMention = `${memberId}`;
                }

                if(channel.isText()) {
                    if(userToMention.length == 0) {
                        channel.send(`**Anyone** **${currentDate}**\n**You can buy the bonus fight now! :coin:**`);
                    } else {
                        channel.send(composeBonusMessage(
                            currentDate,
                            userToMention,
                            `You can buy the bonus fight now! :coin:`
                        ));
                    }
                }
            }

            if(!schedule.loggedBonusRaidAvailable && raidInfo.isBonusAvailable) {
                schedule.loggedBonusRaidAvailable = true;

                if(channel.isText()) channel.send(composeMessage(
                    currentDate,
                    IM_FIGHTERS,
                    `Second raid available! :crossed_swords:`
                ));
            }

            if(!schedule.loggedBonusRaidSuccess && raidInfo.isBonusSuccessful) {
                schedule.loggedBonusRaidSuccess = true;

                if(channel.isText()) channel.send(composeMessage(
                    currentDate,
                    T_HUNTERS,
                    `All fights completed! Collect your rewards! :gem:`
                ));
            }

            await ScheduleModel.updateOne(schedule);
        }
    },

    startOnInit: true,
    timeout: 60000 * 5,
    repeat: true
}