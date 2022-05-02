"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const MemberSchema = new mongoose_1.default.Schema({
    clan_uid: { type: String, required: true },
    guild_id: { type: String, required: true },
    guild_uid: { type: String, required: true }
});
const MemberModel = mongoose_1.default.model('Member', MemberSchema);
exports.default = MemberModel;
