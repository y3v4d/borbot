import mongoose from "mongoose";

export interface IMember {
    clan_uid: string,

    guild_id: string,
    guild_uid: string
}

const MemberSchema = new mongoose.Schema<IMember>({
    clan_uid: { type: String, required: true },

    guild_id: { type: String, required: true },
    guild_uid: { type: String, required: true }
});

const MemberModel = mongoose.model<IMember>('Member', MemberSchema);
export default MemberModel;