import mongoose from "mongoose";

export interface IMember {
    _id?: mongoose.Types.ObjectId,

    guild_id: string,
    clan_uid: string,

    nickname: string,
    highest_zone: number,

    level: number,
    role: number,

    highest_milestone: number,

    discord?: {
        user_id: string,
        username: string,
        avatar: string,
        cached_at: Date,
    }
}

const MemberSchema = new mongoose.Schema<IMember>({
    guild_id: { type: String, required: true },
    clan_uid: { type: String, required: true },
    
    nickname: { type: String, required: true },
    highest_zone: { type: Number, required: true },
    level: { type: Number, required: true },
    role: { type: Number, required: true },

    highest_milestone: { type: Number, required: true, default: -1 },

    discord: {
        user_id: { type: String, required: false },
        username: { type: String, required: false },
        avatar: { type: String, required: false },
        cached_at: { type: Date, required: false },
    }
});

MemberSchema.index({ guild_id: 1, clan_uid: 1 }, { unique: true });
MemberSchema.index({ 'discord.user_id': 1 }, { sparse: true });

const MemberModel = mongoose.model<IMember>('Member', MemberSchema);
export default MemberModel;