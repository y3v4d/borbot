import 'dotenv/config';
import { Intents } from "discord.js";

import Bot from './core/bot';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';

import express from "express";
import bodyparser from "body-parser";
import TestRouter from './routes/test';
import MembersRoute from './routes/members';

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

    /*const rest = express();
    rest.use(bodyparser.json());

    rest.use('/test', TestRouter);
    rest.use('/members', MembersRoute(client));

    rest.listen(3000, () => {
        console.log("Started REST API on port 3000");
    });*/
}).catch(error => logger(error, LoggerType.ERROR));