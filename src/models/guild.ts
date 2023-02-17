import mongoose from "mongoose";

export interface IGuild {
    guild_id: string,

    user_uid: string,
    password_hash: string,

    //raid_announcement_channel?: string,
    clan_chat_channel?: string,
    last_chat_update?: number,
    //last_reminded?: string,

    raid?: mongoose.Types.ObjectId,
    //schedule?: mongoose.Types.ObjectId
}

const GuildSchema = new mongoose.Schema<IGuild>({
    guild_id: { type: String, required: true },

    user_uid: { type: String, required: true },
    password_hash: { type: String, required: true },

    //raid_announcement_channel: { type: String, required: false },
    clan_chat_channel: { type: String, required: false },
    last_chat_update: { type: Number, required: false },
    //last_reminded: { type: String, required: false },

    raid: { type: mongoose.Schema.Types.ObjectId, ref: 'Raid', required: false },
    //schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false }
});

const GuildModel = mongoose.model<IGuild>('Guild', GuildSchema);
export default GuildModel;