import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/guild";
import logger, { LoggerType } from "../../shared/logger";
import { addCommas } from "../../shared/utils";
import ClanService from "../../services/clanService";
import { HydratedDocument } from "mongoose";
import GuildService from "../../services/guildService";
import { ChannelType } from "discord.js";

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

    async run(client: Bot, guild: HydratedDocument<IGuild>) {
        const fetched = client.guilds.cache.get(guild.guild_id);
        if(!fetched) {
            logger(`#updateUsers Couldn't find guild ${guild.guild_id}`);
            return;
        }
        
        const clan = await ClanService.getClanInformation(guild.user_uid, guild.password_hash);

        const members = await GuildService.getGuildConnected(guild.guild_id);
        const fetchedMembers = await fetched.members.fetch();
        for(const member of members) {
            const clanMember = clan!.members.find(o => o.uid === member.clan_uid);
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
                    const channel = await client.getCachedGuildChannel(fetched, guild.milestone_channel || "");
                    if(!channel || channel.type !== ChannelType.GuildText) {
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
            }
        }
    }
};