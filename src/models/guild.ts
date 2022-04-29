import mongoose from "mongoose";

export interface IGuild {
    guild_id: string,

    user_uid: string,
    password_hash: string,

    schedule?: mongoose.Types.ObjectId
}

const GuildSchema = new mongoose.Schema<IGuild>({
    guild_id: { type: String, required: true },

    user_uid: { type: String, required: true },
    password_hash: { type: String, required: true },

    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false }
});

const GuildModel = mongoose.model<IGuild>('Guild', GuildSchema);
export default GuildModel;