import Bot from "../core/bot";
import Action from "../core/action";
import { IGuild } from "../models/guild";
import ScheduleModel from "../models/schedule";
import MemberModel from "../models/member";
import logger, { LoggerType } from "../shared/logger";
import RaidModel from "../models/raid";

function dateToString(date: Date) {
    return `${date.getUTCFullYear().toString()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate().toString().padStart(2, '0'))}`;
}

function composeMessage(date: Date, rank: string, msg: string) {
    return `<@&${rank}> **${dateToString(date)}\n${msg}**`;
}

function composeBonusMessage(date: Date, id: string, msg: string) {
    return `<@${id}> **${dateToString(date)}\n${msg}**`;
}

function differenceBetweenDateInDays(self: Date, other: Date) {
    return (self.getTime() - other.getTime()) / 86400000;
}

function getAbsoluteDate() {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    return date;
}

const IM_FIGHTERS = '953630949789274154';
const T_HUNTERS = '953631155117248552';

export const AnnounceRaids: Action = {
    run: async function(client: Bot, guild: IGuild) {
        try {
            const fetched = client.guilds.cache.get(guild.guild_id);
            if(!fetched) {
                logger(`#announceRaids Couldn't find guild with id ${guild.guild_id}`);
                return;
            }

            const raid = await RaidModel.findOne(guild.raid);
            if(!raid) {
                logger("#announceRaids Raid isn't setup!", LoggerType.WARN);
                return;
            }
    
            logger(`#announceRaids in ${fetched.name}`);
    
            const clan = await client.clanService.getClanInformation(guild.user_uid, guild.password_hash);
            const clanRaid = await client.clanService.getClanNewRaid(guild.user_uid, guild.password_hash, clan.name);
    
            const channel = fetched.channels.cache.get(raid.announcement_channel || "");
            if(!channel || !channel.isText()) {
                logger("#announceRaids Invalid channel for raid announcements!", LoggerType.WARN);
                return;
            }
    
            const currentDate = getAbsoluteDate();
            const checkedToday = raid.last_announced && raid.last_announced.getTime() === currentDate.getTime();

            if(!checkedToday) {
                /*const diff = differenceBetweenDateInDays(currentDate, schedule.cycle_start);
    
                if(diff >= 10 || diff < 0) {
                    const cycles = Math.floor(diff / 10);
                    const newCycleTimestamp = schedule.cycle_start.getTime() + (cycles * 86400000 * 10);
                    schedule.cycle_start = new Date(newCycleTimestamp);
    
                    logger("#announceRaids New cycle start: " + schedule.cycle_start);
                }*/
    
                // reset all values if didn't check today
                raid.last_announced = currentDate;
                raid.currentRaidSuccess = false;
                raid.currentBonusRaidAvailable = false;
                raid.currentBonusRaidSuccess = false;
    
                await channel.send(composeMessage(
                    currentDate,
                    IM_FIGHTERS,
                    `First raid available! :crossed_swords:`
                ));
            }
    
            if(!raid.currentRaidSuccess && clanRaid.isSuccessful) {
                raid.currentRaidSuccess = true;
    
                /*let userToMention = "";
    
                const cycleDay = differenceBetweenDateInDays(currentDate, schedule.cycle_start);
                const scheduleMember = schedule.map.find(o => o.index === (cycleDay + 1));
                if(scheduleMember) {
                    const memberId = (await MemberModel.findById(scheduleMember.member))!.guild_uid;
                    userToMention = `${memberId}`;
                }
    
                if(userToMention.length == 0) {
                    await channel.send(`**Anyone** **${currentDate}**\n**You can buy the bonus fight now! :coin:**`);
                } else {
                    await channel.send(composeBonusMessage(
                        currentDate,
                        userToMention,
                        `You can buy the bonus fight now! :coin:`
                    ));
                }*/
            }
    
            if(!raid.currentBonusRaidAvailable && clanRaid.isBonusAvailable) {
                raid.currentBonusRaidAvailable = true;
    
                await channel.send(composeMessage(
                    currentDate,
                    IM_FIGHTERS,
                    `Second raid available! :crossed_swords:`
                ));
            }
    
            if(!raid.currentBonusRaidSuccess && clanRaid.isBonusSuccessful) {
                raid.currentBonusRaidSuccess = true;
    
                await channel.send(composeMessage(
                    currentDate,
                    T_HUNTERS,
                    `All fights completed! Collect your rewards! :gem:`
                ));
            }
    
            await raid.save();
        } catch(error: any) {
            logger(`#announceRaids Error occurred`, error);
        }
    },

    startOnInit: true,
    timeout: 5,
    repeat: true
}