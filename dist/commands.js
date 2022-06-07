"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const typescript_1 = require("./commands/typescript");
const clan_1 = require("./commands/clan");
const profile_1 = require("./commands/profile");
exports.Commands = [
    typescript_1.TypeScript,
    clan_1.Clan,
    profile_1.Profile,
];
