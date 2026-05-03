import mongoose from "mongoose";
import { IDiscordLink, IMember } from "./types/member.types";

const DiscordLinkSchema = new mongoose.Schema<IDiscordLink>({
    user_id: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    cached_at: { type: Date, required: true },
}, { _id : false });

const MemberSchema = new mongoose.Schema<IMember>({
    guild_id: { type: String, required: true },
    clan_uid: { type: String, required: true },
    
    nickname: { type: String, required: true },
    highest_zone: { type: Number, required: true },
    level: { type: Number, required: true },
    role: { type: Number, required: true },

    highest_milestone: { type: Number, required: true, default: -1 },

    discord: { type: DiscordLinkSchema, required: false }
});

MemberSchema.index({ guild_id: 1, clan_uid: 1 }, { unique: true });
MemberSchema.index({ 'discord.user_id': 1 }, { sparse: true });

const MemberModel = mongoose.model<IMember>('Member', MemberSchema);
export default MemberModel;