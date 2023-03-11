import mongoose from "mongoose";

export interface IMember {
    _id: mongoose.Types.ObjectId,

    guild_id: string,

    guild_uid: string,
    clan_uid: string,

    highest_milestone?: number,
}

const MemberSchema = new mongoose.Schema<IMember>({
    guild_id: { type: String, required: true },

    guild_uid: { type: String, required: true },
    clan_uid: { type: String, required: true },

    highest_milestone: { type: Number, required: false }
});

const MemberModel = mongoose.model<IMember>('Member', MemberSchema);
export default MemberModel;