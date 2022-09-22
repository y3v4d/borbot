import 'dotenv/config';
import { Intents } from "discord.js";

import Bot from './core/bot';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';
import { AddressInfo } from 'net';
import MemberModel from './models/member';
import { request } from 'https';

import express from "express";
import bodyparser from "body-parser";
import cors from 'cors';
import MainRouter from './routes/mainRoutes';
import GuildRouter from './routes/guildRoutes';

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

    const api = express();

    api.use(cors());
    api.use(bodyparser.json());

    api.use('/api', MainRouter);
    api.use('/api/guilds', GuildRouter);

    api.listen(3010, () => {
        logger("Started REST API on port 3010.");
    });
}).catch(error => logger(error, LoggerType.ERROR));