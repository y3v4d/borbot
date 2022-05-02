"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const ScheduleSchema = new mongoose_1.default.Schema({
    start_day: { type: String, required: true },
    length: { type: Number, required: true },
    last_checked: { type: String, required: false },
    loggedRaidSuccess: { type: Boolean, required: false },
    loggedBonusRaidAvailable: { type: Boolean, required: false },
    loggedBonusRaidSuccess: { type: Boolean, required: false },
    map: {
        type: [{
                member: {
                    type: mongoose_1.default.Schema.Types.ObjectId,
                    ref: 'Member'
                },
                index: Number
            }],
        required: false
    }
});
const ScheduleModel = mongoose_1.default.model('Schedule', ScheduleSchema);
exports.default = ScheduleModel;
