import mongoose, { Types } from "mongoose";

export interface IRoleRef {
    id: string,
    valid?: boolean
}

export interface IChannelRef {
    id: string,
    valid?: boolean
}

export interface IMessageRef {
    id: string,
    valid?: boolean
}

export enum RaidStatus {
    NONE = 0,
    FIRST_RAID_AVAILABLE = 1,
    BONUS_RAID_AVAILABLE = 2,
    BONUS_RAID_SUCCESS = 3
}

export interface IGuildRaid {
    channel: IChannelRef,
    fight_role?: IRoleRef,
    claim_role?: IRoleRef,

    status: RaidStatus,
    last_update?: Date
}

export interface IGuildRemind {
    channel: IChannelRef,
    last_update?: Date
}

export interface IGuildChat {
    channel: IChannelRef,
    last_update?: Date
}

export interface IGuildMilestone {
    channel: IChannelRef,
}

export interface IGuildSchedule {
    channel?: IChannelRef,
    message_id?: string,

    cycle_start: Date,
    list: (string | null)[],

    last_update?: Date
}

export interface IGuild {
    _id?: Types.ObjectId,

    guild_id: string,

    user_uid: string,
    password_hash: string,
    clan_name: string,
    
    raid?: IGuildRaid,
    remind?: IGuildRemind,
    chat?: IGuildChat,
    milestone?: IGuildMilestone,
    
    schedule?: IGuildSchedule
}

const ChannelRefSchema = new mongoose.Schema({
    id: { type: String, required: true },
    valid: { type: Boolean, default: true },
}, { _id: false });

const RoleRefSchema = new mongoose.Schema({
    id: { type: String, required: true },
    valid: { type: Boolean, default: true }
}, { _id: false });

const RaidSchema = new mongoose.Schema({
    channel: { type: ChannelRefSchema, required: true },
    fight_role: { type: RoleRefSchema, required: false },
    claim_role: { type: RoleRefSchema, required: false },

    status: { type: Number, required: false, default: RaidStatus.NONE },
    last_update: { type: Date, required: false }
}, { _id: false });

const RemindSchema = new mongoose.Schema({
    channel: { type: ChannelRefSchema, required: false },
    last_update: { type: Date, required: false }
}, { _id: false });

const ChatSchema = new mongoose.Schema({
    channel: { type: ChannelRefSchema, required: false },
    last_update: { type: Date, required: false }
}, { _id: false });

const MilestoneSchema = new mongoose.Schema({
    channel: { type: ChannelRefSchema, required: false },
}, { _id: false });

const ScheduleSchema = new mongoose.Schema({
    cycle_start: { type: Date, required: true },
    list: { type: [String], required: true },

    channel: { type: ChannelRefSchema, required: false },
    message_id: { type: String, required: false },

    last_update: { type: Date, required: false }
}, { _id: false });

const GuildSchema = new mongoose.Schema<IGuild>({
    guild_id: { type: String, required: true },

    user_uid: { type: String, required: true },
    password_hash: { type: String, required: true },
    clan_name: { type: String, required: true },

    raid: { type: RaidSchema, required: false },
    remind: { type: RemindSchema, required: false },
    chat: { type: ChatSchema, required: false },
    milestone: { type: MilestoneSchema, required: false },
    schedule: { type: ScheduleSchema, required: false }
});

GuildSchema.index({ guild_id: 1 }, { unique: true });
GuildSchema.index({ 'raid.channel.id': 1 }, { sparse: true });
GuildSchema.index({ 'raid.fight_role.id': 1 }, { sparse: true });
GuildSchema.index({ 'raid.claim_role.id': 1 }, { sparse: true });
GuildSchema.index({ 'remind.channel.id': 1 }, { sparse: true });
GuildSchema.index({ 'chat.channel.id': 1 }, { sparse: true });
GuildSchema.index({ 'milestone.channel.id': 1 }, { sparse: true });
GuildSchema.index({ 'schedule.channel.id': 1 }, { sparse: true });

const GuildModel = mongoose.model<IGuild>('Guild', GuildSchema);
export default GuildModel;