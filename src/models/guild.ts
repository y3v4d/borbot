import mongoose from "mongoose";

export interface IGuild {
    guild_id: string,

    user_uid: string,
    password_hash: string,

    raid_announcement_channel?: string,
    raid_fight_role?: string,
    raid_claim_role?: string,

    clan_chat_channel?: string,

    last_chat_update?: number,
    last_reminded?: string,

    schedule?: mongoose.Types.ObjectId
}

const GuildSchema = new mongoose.Schema<IGuild>({
    guild_id: { type: String, required: true },

    user_uid: { type: String, required: true },
    password_hash: { type: String, required: true },

    raid_announcement_channel: { type: String, required: false },
    raid_fight_role: { type: String, required: false },
    raid_claim_role: { type: String, required: false },
    
    clan_chat_channel: { type: String, required: false },

    last_chat_update: { type: Number, required: false },
    last_reminded: { type: String, required: false },

    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false }
});

const GuildModel = mongoose.model<IGuild>('Guild', GuildSchema);
export default GuildModel;