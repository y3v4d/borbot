"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnounceRaids = void 0;
const tslib_1 = require("tslib");
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const schedule_1 = tslib_1.__importDefault(require("../models/schedule"));
const clan_1 = require("../shared/clan");
const member_1 = tslib_1.__importDefault(require("../models/member"));
function dateToString(date) {
    return `${date.getUTCFullYear().toString()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate().toString().padStart(2, '0'))}`;
}
function differenceBetweenDays(self, other) {
    return Math.round((new Date(self).getTime() - new Date(other).getTime()) /
        86400000);
}
function composeMessage(date, rank, msg) {
    return `<@&${rank}> **${date}\n${msg}**`;
}
function composeBonusMessage(date, id, msg) {
    return `<@${id}> **${date}\n${msg}**`;
}
const TEST_ANNOUNCEMENTS = '931475713146621983';
const ANNOUNCEMENTS = '953688933609394217';
const IM_FIGHTERS = '953630949789274154';
const T_HUNTERS = '953631155117248552';
exports.AnnounceRaids = {
    run: async function (client) {
        console.log("#announceRaids action");
        const allGuilds = await guild_1.default.find();
        for (const guild of allGuilds) {
            const fetched = await client.guilds.fetch(guild.guild_id);
            console.log(`---- Updating in ${fetched.name} ----`);
            if (!(await clan_1.ClanManager.test(guild.user_uid, guild.password_hash))) {
                console.error("Couldn't find clan with assigned credentials...");
                continue;
            }
            const clan = new clan_1.ClanManager(guild.user_uid, guild.password_hash);
            const raidInfo = await clan.getRaidInfo();
            const channel = await fetched.channels.fetch(ANNOUNCEMENTS);
            if (!channel) {
                console.warn("Couldn't find announcements channel!");
                continue;
            }
            const schedule = (await guild.populate('schedule')).schedule;
            if (!schedule) {
                console.warn("Schedule wasn't setup!");
                continue;
            }
            const currentDate = dateToString(new Date(Date.now()));
            if (!schedule.last_checked || schedule.last_checked != currentDate) {
                const diff = differenceBetweenDays(currentDate, schedule.start_day);
                if (diff >= 10 || diff < 0) {
                    const cycles = Math.floor(diff / 10) * 10;
                    const newCycleTimestamp = new Date(schedule.start_day).getTime() + (cycles * 86400000);
                    schedule.start_day = dateToString(new Date(newCycleTimestamp));
                    console.log("New cycle start: " + schedule.start_day);
                }
                schedule.last_checked = currentDate;
                schedule.loggedRaidSuccess = false;
                schedule.loggedBonusRaidAvailable = false;
                schedule.loggedBonusRaidSuccess = false;
                if (channel.isText())
                    channel.send(composeMessage(currentDate, IM_FIGHTERS, `First raid available! :crossed_swords:`));
            }
            if (!schedule.loggedRaidSuccess && raidInfo.isSuccessful) {
                schedule.loggedRaidSuccess = true;
                let userToMention = "";
                const cycleDay = differenceBetweenDays(currentDate, schedule.start_day);
                const scheduleMember = schedule.map.find(o => o.index === (cycleDay + 1));
                if (scheduleMember) {
                    const memberId = (await member_1.default.findById(scheduleMember.member)).guild_uid;
                    userToMention = `${memberId}`;
                }
                if (channel.isText()) {
                    if (userToMention.length == 0) {
                        channel.send(`**Anyone** **${currentDate}**\n**You can buy the bonus fight now! :coin:**`);
                    }
                    else {
                        channel.send(composeBonusMessage(currentDate, userToMention, `You can buy the bonus fight now! :coin:`));
                    }
                }
            }
            if (!schedule.loggedBonusRaidAvailable && raidInfo.isBonusAvailable) {
                schedule.loggedBonusRaidAvailable = true;
                if (channel.isText())
                    channel.send(composeMessage(currentDate, IM_FIGHTERS, `Second raid available! :crossed_swords:`));
            }
            if (!schedule.loggedBonusRaidSuccess && raidInfo.isBonusSuccessful) {
                schedule.loggedBonusRaidSuccess = true;
                if (channel.isText())
                    channel.send(composeMessage(currentDate, T_HUNTERS, `All fights completed! Collect your rewards! :gem:`));
            }
            await schedule_1.default.updateOne(schedule);
        }
    },
    startOnInit: true,
    timeout: 60000 * 5,
    repeat: true
};
