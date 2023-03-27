import 'dotenv/config';
import { GatewayIntentBits } from "discord.js";

import Bot from './bot/client';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';
import server from './server/server';

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
    logger("MongoDB Conncted!");
    logger("Bot is starting...");

    const client = new Bot({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildMembers
        ]});

    await client.login(process.env.BOT_TOKEN);

    const api = server(client);
    api.listen(3010, () => {
        logger("Started REST API on port 3010.");
    });
}).catch(error => logger(error, LoggerType.ERROR));