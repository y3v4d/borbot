import mongoose, { Types } from "mongoose";
import { IMember } from "./member";

export interface IScheduleMember {
    _id: Types.ObjectId,

    member: Types.ObjectId,
    index: number
}

export interface ISchedule {
    _id: Types.ObjectId,

    guild_id: string,

    cycle_start: Date,
    last_checked?: Date,
    
    length: number,

    loggedRaidSuccess?: boolean,
    loggedBonusRaidAvailable?: boolean,
    loggedBonusRaidSuccess?: boolean,

    schedule_channel?: string,
    schedule_message_id?: string,

    map: Types.DocumentArray<IScheduleMember>
}

export interface IScheduleMemberPopulated {
    _id?: Types.ObjectId,

    member: IMember,
    index: number
}

export interface ISchedulePopulated {
    map: IScheduleMemberPopulated[]
}

const ScheduleSchema = new mongoose.Schema<ISchedule>({
    cycle_start: { type: Date, required: true, default: new Date() },

    guild_id: { type: String, required: false },
    length: { type: Number, required: true, default: 10 },

    last_checked: { type: Date, required: false },
    loggedRaidSuccess: { type: Boolean, required: false },
    loggedBonusRaidAvailable: { type: Boolean, required: false },
    loggedBonusRaidSuccess: { type: Boolean, required: false },

    schedule_channel: { type: String, required: false },
    schedule_message_id: { type: String, required: false },

    map: { 
        type: [{ 
            member: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Member'
            },
            index: Number
        }], 
        required: true,
        default: [] 
    }
});

const ScheduleModel = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
export default ScheduleModel;