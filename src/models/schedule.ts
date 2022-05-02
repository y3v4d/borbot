import mongoose from "mongoose";

export interface IScheduleMember {
    _id: mongoose.Types.ObjectId,

    member: mongoose.Types.ObjectId,
    index: number
}

export interface ISchedule {
    start_day: string,
    length: number,

    last_checked?: string,
    loggedRaidSuccess?: boolean,
    loggedBonusRaidAvailable?: boolean,
    loggedBonusRaidSuccess?: boolean,

    map: mongoose.Types.DocumentArray<IScheduleMember>
}

const ScheduleSchema = new mongoose.Schema<ISchedule>({
    start_day: { type: String, required: true },
    length: { type: Number, required: true },

    last_checked: { type: String, required: false },
    loggedRaidSuccess: { type: Boolean, required: false },
    loggedBonusRaidAvailable: { type: Boolean, required: false },
    loggedBonusRaidSuccess: { type: Boolean, required: false },

    map: { 
        type: [{ 
            member: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Member'
            },
            index: Number
        }], 
        required: false 
    }
});

const ScheduleModel = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
export default ScheduleModel;