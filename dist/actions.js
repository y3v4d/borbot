"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = void 0;
const announceRaids_1 = require("./actions/announceRaids");
const updateUsers_1 = require("./actions/updateUsers");
exports.Actions = [
    updateUsers_1.UpdateUsers,
    announceRaids_1.AnnounceRaids
];
