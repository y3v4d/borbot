import { MergeType } from "mongoose";
import GuildModel, { IGuild } from "../models/guild";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel, { ISchedule, ISchedulePopulated } from "../models/schedule";

export interface GuildConnectedMember {
    guild_uid: string,
    clan_uid: string
}

export interface GuildScheduleUpdateEntry {
    member?: IMember,
    index: number
}

export interface GuildScheduleUpdate {
    cycle_start?: Date,
    entries: GuildScheduleUpdateEntry[],

    channel?: string
}

export interface GuildUpdateParams {
    raid_announcement_channel?: string,
    raid_fight_role?: string,
    raid_claim_role?: string,

    remind_channel?: string,

    milestone_channel?: string,
    chat_channel?: string
}

namespace GuildService {
    export async function addGuild(guild_id: string, uid: string, pwd: string) {  
        const schema: IGuild = {
            guild_id: guild_id,
            user_uid: uid,
            password_hash: pwd
        };
    
        await GuildModel.create(schema);
    }

    export async function getGuild(id: string) {
        const guild = await GuildModel.findOne({ guild_id: id });
        if(!guild) return null;

        return guild;
    }

    export async function updateGuild(id: string, params: GuildUpdateParams) {
        const guild = await GuildService.getGuild(id);
        if(!guild) return false;

        if(params.raid_announcement_channel) {
            guild.raid_announcement_channel = params.raid_announcement_channel;
        }

        if(params.raid_fight_role) {
            guild.raid_fight_role = params.raid_fight_role;
        }

        if(params.raid_claim_role) {
            guild.raid_claim_role = params.raid_claim_role;
        }

        if(params.remind_channel) {
            guild.remind_channel = params.remind_channel;
        }

        if(params.milestone_channel) {
            guild.milestone_channel = params.milestone_channel;
        }

        if(params.chat_channel) {
            guild.chat_channel = params.chat_channel;
        }

        await guild.save();
        return true;
    }

    export async function removeGuild(id: string) {
        const guild = await GuildService.getGuild(id);
        if(!guild) return false;

        if(guild.schedule) {
            await ScheduleModel.deleteOne({ _id: guild.schedule });
        }

        await MemberModel.deleteMany({ guild_id: id });
        await guild.deleteOne();
        
        return true;
    }

    export async function isGuildSetup(id: string) {
        const guild = await GuildModel.exists({ guild_id: id });
        return guild !== null;
    }

    export async function getGuildConnectedMember(guild_id: string, params: { guild_uid?: string, clan_uid?: string }) {
        const member = await MemberModel.findOne({ guild_id: guild_id, guild_uid: params.guild_uid, clan_uid: params.clan_uid });
        if(!member) return null;

        return member;
    }

    export async function getGuildConnected(id: string) {
        const members = await MemberModel.find({ guild_id: id });
        return members;
    }

    export async function updateGuildConnected(guild_id: string, list: GuildConnectedMember[]) {    
        for(const connected of list) {
            if(connected.guild_uid == '') {
                await GuildService.removeGuildConnectedMember({ clan_uid: connected.clan_uid, guild_id: guild_id });
            } else {
                await MemberModel.findOneAndUpdate(
                    { clan_uid: connected.clan_uid, guild_id: guild_id },
                    { guild_uid: connected.guild_uid },
                    { upsert: true }
                );
            }
        }
    }

    export async function removeGuildConnectedMember(member: IMember | { guild_id: string, clan_uid: string }) {
        const schedule = await GuildService.getGuildSchedule(member.guild_id);
        if(!schedule) return false;

        let scheduleIndex = -1;
        if('guild_uid' in member) {
            scheduleIndex = schedule.map.findIndex(o => o.member._id!.equals(member._id!));
        } else {
            scheduleIndex = schedule.map.findIndex(o => o.member.guild_id === member.guild_id && o.member.clan_uid === member.clan_uid);
        }

        if(scheduleIndex !== -1) {
            schedule.map.splice(scheduleIndex, 1);
            await schedule.updateOne({ map: schedule.map });
        }
        
        await MemberModel.findOneAndRemove(member);
        
        return true;
    }

    export async function getGuildSchedule(guild_id: string) {
        const guild = await GuildService.getGuild(guild_id);
        if(!guild) return null;

        let dbSchedule = await ScheduleModel.findOne({ _id: guild.schedule });
        if(!dbSchedule) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            dbSchedule = await ScheduleModel.create({ cycle_start: today, length: 10 });
            guild.schedule = dbSchedule._id;

            await guild.save();
        }

        const populated = await dbSchedule.populate<Pick<ISchedulePopulated, 'map'>>("map.member");
        return populated;
    }

    export async function updateGuildSchedule(id: string, data: GuildScheduleUpdate) {
        const schedule = await GuildService.getGuildSchedule(id);
        if(!schedule) return false;
    
        for(let i = 0; i < 10; ++i) {
            const entry = data.entries.find(o => o.index == i + 1);
            if(!entry) continue;
    
            const index = schedule.map.findIndex(o => o.index === i + 1);
            if(index === -1) {
                if(entry.member) schedule.map.push({ member: entry.member, index: i + 1 });
                continue;
            } else if(entry.member) {
                schedule.map[index].member = entry.member;
            } else {
                schedule.map.splice(index, 1);
            }
        }

        if(data.channel) {
            schedule.schedule_channel = data.channel;
        }

        if(data.cycle_start) {
            data.cycle_start.setUTCHours(0, 0, 0, 0);
            schedule.cycle_start = data.cycle_start;
        }
    
        await schedule.save();
        return true;
    }
}

export default GuildService;