import 'dotenv/config';
import { Intents } from "discord.js";

import Bot from './core/bot';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';

import express, { ErrorRequestHandler } from "express";
import bodyparser from "body-parser";
import cors from 'cors';
import GuildRouter from './server/routes/guildRoutes';
import session from 'express-session';
import AuthRouter from './server/routes/authRouter';
import MeRouter from './server/routes/meRouter';
import cookieParser from 'cookie-parser';
import GuildService from './services/guildService';
import ClanService from './services/clanService';
import Code from './shared/code';

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
    api.set('guildService', new GuildService(client));
    api.set('clanService', new ClanService());

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

    const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
        if(err.code === undefined) {
            logger(`Unknown error: ${err.message}`, LoggerType.ERROR);

            res.status(500).send({ code: -1, message: 'Unknown error' });
            return;
        } else if(err.code === Code.DISCORD_API_ERROR) {
            logger(`Discord call failed with status ${err.status}, path: ${err.path}, message: ${err.data.message}`, LoggerType.ERROR);
            
            if(err.status === 401) {
                res.status(401).send({ code: Code.DISCORD_INVALID_TOKEN, message: "Invalid token" });

                return;
            } else if(err.status == 429) {
                res.status(429).send({ code: Code.DISCORD_RATE_LIMIT, message: "You reached discord rate limit for this call" });
            }
        } else if(err.code === Code.NO_RESPONSE) {
            logger(`No reponse from discord servers`, LoggerType.ERROR);

            res.status(504).send({ code: Code.NO_RESPONSE, message: "Didn't receive any reponse from the server" });
        } else if(err.code === Code.INTERNAL_SERVER_ERROR) {
            logger(`Internal error: ${err.message}`, LoggerType.ERROR);

            res.status(500).send({ code: Code.INTERNAL_SERVER_ERROR, message: "Internal server error" });
        } else {
            res.status(404).send(err);
        }
    };

    api.use(errorHandler);

    api.listen(3010, () => {
        logger("Started REST API on port 3010.");
    });
}).catch(error => logger(error, LoggerType.ERROR));