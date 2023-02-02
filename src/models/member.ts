import mongoose from "mongoose";

export interface IMember {
    clan_uid: string,
    highest_milestone?: number,

    guild_id: string,
    guild_uid: string
}

const MemberSchema = new mongoose.Schema<IMember>({
    clan_uid: { type: String, required: true },
    highest_milestone: { type: Number, required: false },

    guild_id: { type: String, required: true },
    guild_uid: { type: String, required: true }
});

const MemberModel = mongoose.model<IMember>('Member', MemberSchema);
export default MemberModel;