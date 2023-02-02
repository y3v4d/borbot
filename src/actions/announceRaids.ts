import Bot from "../core/bot";
import Action from "../core/action";
import GuildModel, { IGuild } from "../models/guild";
import ScheduleModel from "../models/schedule";
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

async function AnnounceRaidsForGuild(client: Bot, guild: IGuild) {
    try {
        const fetched = await client.guilds.cache.get(guild.guild_id);
        if(!fetched) {
            logger(`#announceRaids Couldn't find guild with id ${guild.guild_id}`);
            return;
        }

        logger(`#announceRaids in ${fetched.name}`);

        const clan = await client.clanService.getClanInformation(guild.user_uid, guild.password_hash);
        const raid = await client.clanService.getNewRaid(guild.user_uid, guild.password_hash, clan.guild.name);

        const channel = await fetched.channels.cache.get(ANNOUNCEMENTS);
        if(!channel) {
            logger("#announceRaids Couldn't find announcements channel!", LoggerType.WARN);
            return;
        } else if(!channel.isText()) {
            logger(`#announceRaids Invalid channel for raid announcements!`, LoggerType.WARN);
            return;
        }

        const schedule = await ScheduleModel.findOne(guild.schedule);
        if(!schedule) {
            logger("#announceRaids Schedule wasn't setup!", LoggerType.WARN);
            return;
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

            channel.send(composeMessage(
                currentDate,
                IM_FIGHTERS,
                `First raid available! :crossed_swords:`
            ));
        }

        if(!schedule.loggedRaidSuccess && raid.isSuccessful) {
            schedule.loggedRaidSuccess = true;

            let userToMention = "";

            const cycleDay = differenceBetweenDays(currentDate, schedule.start_day);
            const scheduleMember = schedule.map.find(o => o.index === (cycleDay + 1));
            if(scheduleMember) {
                const memberId = (await MemberModel.findById(scheduleMember.member))!.guild_uid;
                userToMention = `${memberId}`;
            }

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

        if(!schedule.loggedBonusRaidAvailable && raid.isBonusAvailable) {
            schedule.loggedBonusRaidAvailable = true;

            channel.send(composeMessage(
                currentDate,
                IM_FIGHTERS,
                `Second raid available! :crossed_swords:`
            ));
        }

        if(!schedule.loggedBonusRaidSuccess && raid.isBonusSuccessful) {
            schedule.loggedBonusRaidSuccess = true;

            channel.send(composeMessage(
                currentDate,
                T_HUNTERS,
                `All fights completed! Collect your rewards! :gem:`
            ));
        }

        await schedule.save();
    } catch(error: any) {
        logger(`#announceRaids API call failed with code ${error.code}, message: ${error.message}`);
    }
}

export const AnnounceRaids: Action = {
    run: async function(client: Bot) {
        const guilds = await GuildModel.find();

        for(const guild of guilds) {
            AnnounceRaidsForGuild(client, guild);
        }
    },

    startOnInit: true,
    timeout: 5,
    repeat: true
}