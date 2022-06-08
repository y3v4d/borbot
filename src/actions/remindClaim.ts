import Bot from "../core/bot";
import { ClanClass, ClanManager, ClanMember } from "../shared/clan";
import Action from "../core/action";
import MemberModel from "../models/member";
import GuildModel from "../models/guild";

const REMIND = "908335160171331596";
const REMIND_TEST = "931475713146621983";

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

function differenceBetweenDays(self: string, other: string) {
    return Math.round(
        (new Date(self).getTime() - new Date(other).getTime()) /
        86400000 // MS in day
    );
}

export const RemindClaim: Action = {
    run: async function(client: Bot) {
        console.log("#remindClaim action");

        const allGuilds = await GuildModel.find();
        for(const dbGuild of allGuilds) {
            const lastReminded = (dbGuild.last_reminded === undefined ? "2000-01-01" : dbGuild.last_reminded);
            const currentDate = new Date(Date.now());

            // return if the same day or isn't past 11pm
            if(differenceBetweenDays(dateToString(currentDate), lastReminded) === 0 || currentDate.getUTCHours() !== 23) return;
            dbGuild.last_reminded = dateToString(currentDate);

            const fetchedGuild = await client.guilds.fetch(dbGuild.guild_id);
            if(!fetchedGuild) continue;

            if(!(await ClanManager.test(dbGuild.user_uid, dbGuild.password_hash))) {
                console.error("Couldn't find clan with assigned credentials...");
                continue;
            }

            const clan = new ClanManager(dbGuild.user_uid, dbGuild.password_hash);
            await clan.fetchNewRaid();

            const channel = await fetchedGuild.channels.fetch(REMIND);
            if(!channel?.isText()) return;

            const missing = clan.getAllMembers().filter(value => 
                clan.newRaid!.scores.findIndex(o => o.uid === value.uid) === -1
            );

            const missingBonus = clan.getAllMembers().filter(value => 
                clan.newRaid!.bonusScores.findIndex(o => o.uid === value.uid) === -1
            );

            await dbGuild.save();

            // return if everyone collected
            if(missing.length === 0 && missingBonus.length === 0) return;

            let msg = `:coin: **RAID REMINDER ${dateToString(currentDate)}** :coin:\n\n`;
            if(!clan.newRaid?.isSuccessful) {
                msg += ":crossed_swords: FIRST RAID NOT COMPLETED :crossed_swords:\n\n"
            } else if(missing.length > 0) {
                msg += await composeRemainder(client, missing, ":crossed_swords: FIRST RAID :crossed_swords:");
                msg += '\n';
            }
            
            if(!clan.newRaid?.isBonusSuccessful) {
                msg += "**:gem: BONUS RAID NOT COMPLETED :gem:**\n\n";
            } else if(missingBonus.length > 0) {
                msg += await composeRemainder(client, missingBonus, ":gem: BONUS RAID :gem:");
                msg += '\n';
            }

            msg += "**WARNING!** *Everyone mentioned, you have less then 1 hour to claim the rewards!*";

            await channel.send(msg);
        }
    },

    startOnInit: true,
    repeat: true,

    timeout: 60000 * 5 // 5 minute
}