import mongoose, { MergeType, Model } from "mongoose";
import ClickerHeroesAPI from "../api/clickerheroes";
import Bot from "../core/bot";
import GuildModel, { IGuild } from "../models/guild";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel, { ISchedule, ISchedulePopulated } from "../models/schedule";
import Code from "../shared/code";
import logger, { LoggerType } from "../shared/logger";

export interface GuildConnectedMember {
    guild_uid: string,
    clan_uid: string
}

export interface GuildScheduleUpdateEntry {
    member: IMember,
    index: number
}

export interface GuildScheduleUpdate {
    cycle_start?: Date,
    entries: GuildScheduleUpdateEntry[],

    channel?: string
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

    export async function removeGuild(id: string) {
        const guild = await GuildService.getGuild(id);
        if(!guild) return false;

        await GuildModel.findOneAndRemove(guild);
        return true;
    }

    export async function getGuild(id: string) {
        const guild = await GuildModel.findOne({ guild_id: id });
        return guild as IGuild | null;
    }

    export async function isGuildSetup(id: string) {
        const guild = await GuildModel.exists({ guild_id: id });
        return guild !== null;
    }

    export async function getGuildConnectedMember(guild_id: string, member_id: string) {
        const member = await MemberModel.findOne({ guild_id: guild_id, guild_uid: member_id });
        return member as IMember | null;
    }

    export async function getGuildConnected(id: string) {
        const members = await MemberModel.find({ guild_id: id });
        return members as IMember[];
    }

    export async function updateGuildConnected(guild_id: string, list: GuildConnectedMember[]) {    
        for(const connected of list) {
            if(connected.guild_uid == '') {
                await MemberModel.findOneAndDelete({ clan_uid: connected.clan_uid, guild_id: guild_id });
            } else {
                await MemberModel.findOneAndUpdate(
                    { clan_uid: connected.clan_uid, guild_id: guild_id }, 
                    { guild_uid: connected.guild_uid },
                    { upsert: true }
                );
            }
        }
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

            await GuildModel.updateOne(guild);
        }

        const populated = await dbSchedule.populate<Pick<ISchedulePopulated, 'map'>>("map.member");
        return populated as MergeType<ISchedule, Pick<ISchedulePopulated, 'map'>>;
    }

    export async function updateGuildSchedule(id: string, data: GuildScheduleUpdate) {
        const dbSchedule = await GuildService.getGuildSchedule(id);
        if(!dbSchedule) return false;
    
        for(let i = 0; i < 10; ++i) {
            const member = data.entries.find(o => o.index == i + 1)?.member;
            if(!member) continue;
    
            const entry = dbSchedule.map.find(o => o.index === i + 1);
            if(!entry) {
                console.warn(`Didn't find entry with index ${i + 1}. Creating...`);
                dbSchedule.map.push({ member: member, index: i + 1 });
                continue;
            }
    
            entry.member = member;
        }

        if(data.channel) {
            dbSchedule.schedule_channel = data.channel;
        }

        if(data.cycle_start) {
            data.cycle_start.setUTCHours(0, 0, 0, 0);
            dbSchedule.cycle_start = data.cycle_start;
        }
    
        await ScheduleModel.updateOne(dbSchedule);
        return true;
    }
}

export default GuildService;