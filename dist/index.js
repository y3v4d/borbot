"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("dotenv/config");
const discord_js_1 = require("discord.js");
const bot_1 = tslib_1.__importDefault(require("./core/bot"));
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
mongoose_1.default.connect(process.env.MONGODB_URI).then(async () => {
    console.log("MongoDB Conncted!");
    console.log("Bot is starting...");
    const client = new bot_1.default({
        intents: [
            discord_js_1.Intents.FLAGS.GUILDS,
            discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
            discord_js_1.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            discord_js_1.Intents.FLAGS.GUILD_MEMBERS
        ]
    }, process.env.USER_UID, process.env.HASH);
    client.login(process.env.TOKEN);
}).catch(error => console.error(error));
