"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const typescript_1 = require("./commands/typescript");
const clan_1 = require("./commands/clan");
const connect_1 = require("./commands/connect");
const connected_1 = require("./commands/connected");
const schedule_1 = require("./commands/schedule");
const setup_1 = require("./commands/setup");
const make_schedule_1 = require("./commands/make-schedule");
const setup_schedule_1 = require("./commands/setup-schedule");
exports.Commands = [
    typescript_1.TypeScript,
    clan_1.Clan,
    connect_1.Connect,
    connected_1.Connected,
    schedule_1.Schedule,
    make_schedule_1.MakeSchedule,
    setup_1.Setup,
    setup_schedule_1.SetupSchedule
];
