import mongoose from "mongoose";

export interface IScheduleMember {
    _id: mongoose.Types.ObjectId,

    member: mongoose.Types.ObjectId,
    index: number
}

export interface ISchedule {
    start_day: string,
    length: number,

    map: mongoose.Types.DocumentArray<IScheduleMember>
}

const ScheduleSchema = new mongoose.Schema<ISchedule>({
    start_day: { type: String, required: true },
    length: { type: Number, required: true },

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