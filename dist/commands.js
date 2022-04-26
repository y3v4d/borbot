"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const typescript_1 = require("./commands/typescript");
const clan_1 = require("./commands/clan");
const connect_1 = require("./commands/connect");
const connected_1 = require("./commands/connected");
const schedule_1 = require("./commands/schedule");
const profile_1 = require("./commands/profile");
exports.Commands = [
    typescript_1.TypeScript,
    clan_1.Clan,
    connect_1.Connect,
    connected_1.Connected,
    schedule_1.Schedule,
    profile_1.Profile
];
