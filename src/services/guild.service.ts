import GuildModel, { IGuild } from "../models/guild";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel, { ISchedulePopulated } from "../models/schedule";
import InMemoryCache from "../shared/cache";

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

class GuildService {
    private _cacheGuild: InMemoryCache<IGuild | null> = new InMemoryCache(5 * 60 * 1000);
    private _cacheGuildKey = (id: string) => `guild:${id}`;

    async addGuild(guild_id: string, uid: string, pwd: string) {
        const guild = new GuildModel({ guild_id: guild_id, user_uid: uid, password_hash: pwd });
        await guild.save();

        const lean = guild.toObject();
        this._cacheGuild.set(this._cacheGuildKey(guild_id), lean);

        return lean;
    }

    async getGuild(id: string) {
        const cached = this._cacheGuild.get(this._cacheGuildKey(id));
        if(cached !== undefined) {
            return cached;
        }

        const guild = await GuildModel.findOne({ guild_id: id }).lean();
        this._cacheGuild.set(this._cacheGuildKey(id), guild ?? null);

        return guild ?? null;
    }

    async updateGuild(id: string, params: GuildUpdateParams) {
        const update: any = {};

        if(params.raid_announcement_channel) {
            update.raid_announcement_channel = params.raid_announcement_channel;
        }

        if(params.raid_fight_role) {
            update.raid_fight_role = params.raid_fight_role;
        }

        if(params.raid_claim_role) {
            update.raid_claim_role = params.raid_claim_role;
        }

        if(params.remind_channel) {
            update.remind_channel = params.remind_channel;
        }

        if(params.milestone_channel) {
            update.milestone_channel = params.milestone_channel;
        }

        if(params.chat_channel) {
            update.chat_channel = params.chat_channel;
        }

        const result = await GuildModel.updateOne({ guild_id: id }, { $set: update });
        if(result.matchedCount === 0) {
            return false;
        }

        this._cacheGuild.delete(this._cacheGuildKey(id));
        return true;
    }

    async removeGuild(id: string) {
        await ScheduleModel.deleteOne({ guild_id: id });
        await MemberModel.deleteMany({ guild_id: id });
        await GuildModel.deleteOne({ guild_id: id });

        this._cacheGuild.delete(this._cacheGuildKey(id));
        return true;
    }

    async isGuildSetup(id: string) {
        const guild = await this.getGuild(id);
        return guild !== null;
    }

    async getGuildMemberByClanUID(guild_id: string, clan_uid: string) {
        const member = await MemberModel.findOne({ guild_id, clan_uid }).lean();
        return member ?? null;
    }

    async getGuildMemberByDiscordUID(guild_id: string, guild_uid: string) {
        const member = await MemberModel.findOne({ guild_id, guild_uid }).lean();
        return member ?? null;
    }

    async getGuildMembers(id: string) {
        const members = await MemberModel.find({ guild_id: id });
        return members;
    }

    async updateGuildConnected(guild_id: string, list: GuildConnectedMember[]) {    
        for(const connected of list) {
            if(connected.guild_uid == '') {
                await this.removeGuildConnectedMember({ clan_uid: connected.clan_uid, guild_id: guild_id });
            } else {
                await MemberModel.findOneAndUpdate(
                    { clan_uid: connected.clan_uid, guild_id: guild_id },
                    { guild_uid: connected.guild_uid },
                    { upsert: true }
                );
            }
        }
    }

    async removeGuildConnectedMember(member: IMember | { guild_id: string, guild_uid?: string, clan_uid?: string }) {
        const schedule = await this.getGuildSchedule(member.guild_id);
        if(!schedule) return false;

        let scheduleIndex = -1;
        if('_id' in member) {
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

    async getGuildSchedule(guild_id: string) {
        const guild = await this.getGuild(guild_id);
        if(!guild) return null;

        let dbSchedule = await ScheduleModel.findOne({ _id: guild.schedule });
        if(!dbSchedule) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            dbSchedule = await ScheduleModel.create({ cycle_start: today, length: 10 });

            await GuildModel.updateOne({ guild_id: guild_id }, { $set: { schedule: dbSchedule!._id } });
            this._cacheGuild.delete(this._cacheGuildKey(guild_id));
        }

        const populated = await dbSchedule.populate<Pick<ISchedulePopulated, 'map'>>("map.member");
        return populated;
    }

    async updateGuildSchedule(id: string, data: GuildScheduleUpdate) {
        const schedule = await this.getGuildSchedule(id);
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