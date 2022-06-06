import 'dotenv/config';
import { Intents } from "discord.js";

import Bot from './core/bot';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
    console.log("MongoDB Conncted!");
    console.log("Bot is starting...");

    const client = new Bot({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.GUILD_MEMBERS
        ]}, process.env.USER_UID!, process.env.HASH!);

    client.login(process.env.TOKEN);
}).catch(error => console.error(error));