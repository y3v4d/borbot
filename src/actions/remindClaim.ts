import Bot from "../core/bot";
import Action from "../core/action";
import MemberModel from "../models/member";
import GuildModel, { IGuild } from "../models/guild";
import logger, { LoggerType } from "../shared/logger";
import { ClanClass, ClanMember } from "../services/clanService";
import RaidModel from "../models/raid";

async function composeRemainder(client: Bot, members: ClanMember[], title: string) {
    let msg = `**${title}**\n`;

    for(const member of members) {
        msg += '- ';

        const dbMember = await MemberModel.findOne({ clan_uid: member.uid });
        msg += (dbMember ? `<@${dbMember.guild_uid}>` : member.nickname);
        msg += ` **The ${ClanClass[member.class]}**\n`;
    }

    return msg;
}

function dateToString(date: Date) {
    return `${date.getUTCFullYear().toString()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate().toString().padStart(2, '0'))}`;
}

function differenceBetweenDaysOld(self: string, other: string) {
    return Math.round(
        (new Date(self).getTime() - new Date(other).getTime()) /
        86400000 // MS in day
    );
}

function differenceBetweenDatesInDays(self: Date, other: Date) {
    return Math.round((self.getTime() - other.getTime()) / 86400000);
}

function getAbsoluteDate() {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    return date;
}

function getAbsoluteFromDate(date: Date) {
    const temp = new Date(date);
    temp.setUTCHours(0, 0, 0, 0);

    return temp;
}

export const RemindClaim: Action = {
    run: async function(client: Bot, guild: IGuild) {
        const fetchedGuild = await client.guilds.cache.get(guild.guild_id);
        if(!fetchedGuild) {
            logger(`#remindClaim Couldn't get guild ${guild.guild_id}`);
            return;
        }

        logger(`#remindClaim in ${fetchedGuild.name}`);

        const raid = await RaidModel.findOne(guild.raid);
        if(!raid) {
            logger("#remindClaim Raid isn't setup!", LoggerType.WARN);
            return;
        }

        const lastReminded = raid.last_reminded || new Date("2000-01-01");
        const currentDate = new Date();

        // return if the same day or isn't past 11pm
        if(differenceBetweenDatesInDays(currentDate, lastReminded) === 0 || currentDate.getUTCHours() !== 23) {
            return;
        }

        raid.last_reminded = getAbsoluteFromDate(currentDate);
        await raid.save();

        const clan = await client.clanService.getClanInformation(guild.user_uid, guild.password_hash);
        const clanRaid = await client.clanService.getClanNewRaid(guild.user_uid, guild.password_hash, clan.name);

        const channel = await fetchedGuild.channels.fetch(raid.remind_channel || "");
        if(!channel || !channel.isText()) {
            logger(`#remindClaim Couldn't get valid channel`, LoggerType.WARN);
            return;
        }

        const missing = clan.members.filter(value => 
            clanRaid.scores.findIndex(o => o.uid === value.uid) === -1
        );

        const missingBonus = clan.members.filter(value => 
            clanRaid.bonusScores.findIndex(o => o.uid === value.uid) === -1
        );

        // return if everyone collected
        if(missing.length === 0 && missingBonus.length === 0) return;

        let msg = `:coin: **RAID REMINDER ${dateToString(currentDate)}** :coin:\n\n`;
        if(!clanRaid.isSuccessful) {
            msg += ":crossed_swords: FIRST RAID NOT COMPLETED :crossed_swords:\n\n"
        } else if(missing.length > 0) {
            msg += await composeRemainder(client, missing, ":crossed_swords: FIRST RAID :crossed_swords:");
            msg += '\n';
        }
        
        if(!clanRaid.isBonusSuccessful) {
            msg += "**:gem: BONUS RAID NOT COMPLETED :gem:**\n\n";
        } else if(missingBonus.length > 0) {
            msg += await composeRemainder(client, missingBonus, ":gem: BONUS RAID :gem:");
            msg += '\n';
        }

        msg += "**WARNING!** *Everyone mentioned, you have less then 1 hour to claim the rewards!*";

        await channel.send(msg);
    },

    startOnInit: true,
    repeat: true,

    timeout: 5
}