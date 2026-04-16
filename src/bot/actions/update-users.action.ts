import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/guild";
import { addCommas } from "../../shared/utils";
import { ChannelType } from "discord.js";

export const UpdateUsers: Action = {
    name: "update-users",
    timeout: 5,
    startOnInit: true,
    repeat: true,

    async run(bot: Bot, guild: IGuild) {
        const { guildService } = bot;

        const fetched = await bot.getCachedGuild(guild.guild_id);
        if(!fetched) {
            throw new Error(`Couldn't fetch discord server`);
        }

        let milestone_channel;
        if(guild.milestone && guild.milestone.channel) {
            milestone_channel = await bot.getCachedGuildChannel(fetched, guild.milestone.channel.id);
            if(!milestone_channel || milestone_channel.type !== ChannelType.GuildText) {
                throw new Error(`Couldn't fetch discord channel ${guild.milestone.channel.id}`);
            }
        }

        const operations: Promise<any>[] = [];
        const members = await guildService.getGuildMembers(guild.guild_id);
        for(const member of members) {
            const lastMilestone = member.highest_milestone || -1;
            const currentMilestone = getMilestoneFromZone(member.highest_zone);

            if(lastMilestone < currentMilestone) {
                if(milestone_channel) {
                    const prettyZone = addCommas(getZoneFromMilestone(currentMilestone));
                    operations.push(
                        milestone_channel.send(`**${member.nickname}** just reached a new milestone of **${prettyZone}!** :crossed_swords:`)
                    );

                    operations.push(
                        guildService.updateMember(member._id.toString(), { highest_milestone: currentMilestone })
                    );
                }
            }

            if(!member.discord) {
                continue;
            }

            const dcMember = fetched.members.cache.get(member.discord.user_id);
            if(dcMember && dcMember.manageable) {
                operations.push(
                    dcMember.setNickname(`${member.nickname} [${member.highest_zone}]`)
                );
            }
        }

        const result = await Promise.allSettled(operations);
        let errorMessage = "";
        for(const res of result) {
            if(res.status === "rejected") {
                errorMessage += `- ${res.reason.message}\n`;
            }
        }

        if(errorMessage.length > 0) {
            throw new Error(`Errors occurred while updating users:\n${errorMessage}`);
        }
    }
};

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