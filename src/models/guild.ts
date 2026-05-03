import mongoose from "mongoose";
import { IChannelRef, IGuild, IGuildChat, IGuildMilestone, IGuildRaid, IGuildRemind, IGuildSchedule, IRoleRef, RaidStatus } from "./types/guild.types";

const ChannelRefSchema = new mongoose.Schema<IChannelRef>({
    id: { type: String, required: true },
    valid: { type: Boolean, required: true, default: true },
}, { _id: false });

const RoleRefSchema = new mongoose.Schema<IRoleRef>({
    id: { type: String, required: true },
    valid: { type: Boolean, required: true, default: true }
}, { _id: false });

const RaidSchema = new mongoose.Schema<IGuildRaid>({
    channel: { type: ChannelRefSchema, required: true },
    fight_role: { type: RoleRefSchema, required: false },
    claim_role: { type: RoleRefSchema, required: false },

    status: { type: Number, required: false, default: RaidStatus.NONE },
    last_update: { type: Date, required: false }
}, { _id: false });

const RemindSchema = new mongoose.Schema<IGuildRemind>({
    channel: { type: ChannelRefSchema, required: false },
    last_update: { type: Date, required: false }
}, { _id: false });

const ChatSchema = new mongoose.Schema<IGuildChat>({
    channel: { type: ChannelRefSchema, required: false },
    last_update: { type: Date, required: false }
}, { _id: false });

const MilestoneSchema = new mongoose.Schema<IGuildMilestone>({
    channel: { type: ChannelRefSchema, required: false },
}, { _id: false });

const ScheduleSchema = new mongoose.Schema<IGuildSchedule>({
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

const GuildModel = mongoose.model<IGuild>('Guild', GuildSchema);
export default GuildModel;