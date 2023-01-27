import 'dotenv/config';
import { Intents } from "discord.js";

import Bot from './core/bot';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';

import express from "express";
import bodyparser from "body-parser";
import cors from 'cors';
import GuildRouter from './server/routes/guildRoutes';
import session from 'express-session';
import AuthRouter from './server/routes/authRouter';
import MeRouter from './server/routes/meRouter';
import cookieParser from 'cookie-parser';

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
    logger("MongoDB Conncted!");
    logger("Bot is starting...");

    const client = new Bot({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.GUILD_MEMBERS
        ]});

    await client.login(process.env.TOKEN);

    const api = express();
    api.set('bot', client);

    api.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
    api.use(bodyparser.json());
    api.use(cookieParser());
    api.use(session({
        secret: process.env.SESSION_SECRET!,
        saveUninitialized: true,
        resave: true
    }));

    api.use('/api/auth', AuthRouter);
    api.use('/api/me', MeRouter);
    api.use('/api/guilds', GuildRouter);

    api.listen(3010, () => {
        logger("Started REST API on port 3010.");
    });
}).catch(error => logger(error, LoggerType.ERROR));