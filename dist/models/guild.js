"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const GuildSchema = new mongoose_1.default.Schema({
    guild_id: { type: String, required: true },
    user_uid: { type: String, required: true },
    password_hash: { type: String, required: true },
    schedule: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Schedule', required: false }
});
const GuildModel = mongoose_1.default.model('Guild', GuildSchema);
exports.default = GuildModel;
