import Bot from "../core/bot";
import Action from "../core/action";
import MemberModel from "../models/member";
import GuildModel, { IGuild } from "../models/guild";
import logger, { LoggerType } from "../shared/logger";
import { addCommas } from "../shared/utils";

const MILESTONE_CHANNEL = "908335160171331596";

const MILESTONES = [
    100, 200, 300,
    1000, 5000,
    10000, 20000, 50000, 100000, 150000, 200000,
    250000, 300000, 350000, 400000, 450000, 500000,
    750000,
    1000000
];

function getMilestoneFromZone(zone: number) {
    let milestone = -1;
    for(let i = 0; i < MILESTONES.length; ++i) {
        if(zone < MILESTONES[i]) {
            milestone = i;
            break;
        }
    }

    if(milestone == -1) { // >= 1M
        // add milestone point every 100k past 1M
        const add = Math.floor((zone - 1000000) / 100000);
        milestone = MILESTONES.length + add;
    }

    return milestone;
}

function getZoneFromMilestone(index: number) {
    if(index <= 0) {
        return 0;
    } else if(index <= MILESTONES.length) {
        return MILESTONES[index - 1];
    }

    const add = index - MILESTONES.length;
    return 1000000 + 100000 * add;
}

export const UpdateUsers: Action = {
    timeout: 10,

    startOnInit: true,
    repeat: true,

    async run(client: Bot, guild: IGuild) {
        const fetched = client.guilds.cache.get(guild.guild_id);
        if(!fetched) {
            logger(`#updateUsers Couldn't find guild ${guild.guild_id}`);
            return;
        }
        
        const clan = await client.clanService.getClanInformation(guild.user_uid, guild.password_hash);

        const members = await MemberModel.find({ guild_id: guild.guild_id });
        const fetchedMembers = await fetched.members.fetch();
        for(const member of members) {
            const clanMember = clan.members.find(o => o.uid === member.clan_uid);
            if(!clanMember) {
                logger(`#updateUsers Clan member ${member.clan_uid} doesn't exist!`, LoggerType.ERROR);
                continue;
            }

            const lastMilestone = member.highest_milestone || -1;
            const currentMilestone = getMilestoneFromZone(clanMember.highestZone);

            if(lastMilestone < currentMilestone) {
                member.highest_milestone = currentMilestone;
                member.save();

                if(lastMilestone !== -1) {
                    const channel = fetched.channels.cache.get(MILESTONE_CHANNEL);
                    if(!channel?.isText()) {
                        logger("#updateUsers Couldn't find announcement channel!", LoggerType.ERROR);
                    } else {
                        const prettyZone = addCommas(getZoneFromMilestone(currentMilestone));

                        channel.send(`**${clanMember.nickname}** just reached a new milestone of **${prettyZone}!** :crossed_swords:`);
                    }
                }
            }

            const dcMember = fetchedMembers.get(member.guild_uid);
            if(dcMember && dcMember.manageable) {
                dcMember.setNickname(`${clanMember.nickname} [${clanMember.level}]`);
            } else {
                logger(`#updateUsers User ${dcMember?.nickname} couldn't be updated!`, LoggerType.WARN);
            }
        }
    }
};