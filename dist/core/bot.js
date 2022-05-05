"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const clan_1 = require("../shared/clan");
class Bot extends discord_js_1.Client {
    clan;
    constructor(options, uid, passwordHash) {
        super(options);
        this.clan = new clan_1.ClanManager(uid, passwordHash);
    }
}
exports.default = Bot;
