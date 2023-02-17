import mongoose from "mongoose"

export interface IRaid {
    guild_id: string,

    announcement_channel?: string,
    last_announced?: Date,

    remind_channel?: string,
    last_reminded?: Date,

    currentRaidSuccess?: boolean,
    currentBonusRaidAvailable?: boolean,
    currentBonusRaidSuccess?: boolean

    schedule?: mongoose.Types.ObjectId
}

const RaidSchema = new mongoose.Schema<IRaid>({
    guild_id: { type: String, required: true },

    announcement_channel: { type: String, required: false },
    last_announced: { type: Date, required: false },

    remind_channel: { type: String, required: false },
    last_reminded: { type: String, required: false },

    currentRaidSuccess: { type: Boolean, required: false },
    currentBonusRaidAvailable: { type: Boolean, required: false },
    currentBonusRaidSuccess: { type: Boolean, required: false },

    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: false }
});

const RaidModel = mongoose.model<IRaid>('Raid', RaidSchema);
export default RaidModel;