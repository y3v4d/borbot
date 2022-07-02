import 'dotenv/config';
import { Intents } from "discord.js";

import Bot from './core/bot';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
    logger("MongoDB Conncted!");
    logger("Bot is starting...");

    const client = new Bot({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.GUILD_MEMBERS
        ]}, process.env.USER_UID!, process.env.HASH!);

    client.login(process.env.TOKEN);
}).catch(error => logger(error, LoggerType.ERROR));