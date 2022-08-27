import 'dotenv/config';
import { Intents } from "discord.js";
import express, { response } from 'express';

import Bot from './core/bot';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';
import { AddressInfo } from 'net';
import MemberModel from './models/member';
import { request } from 'https';

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

    const rest = express();
    rest.get('/test', async function(req, res) {
        const fetchedGuild = await client.guilds.fetch(process.env.GUILD_ID!);
        const members = await MemberModel.find({ guild_id: process.env.GUILD_ID! });

        let loaded = 0;
        const TOTAL = members.length;

        let avatarList: string[] = [];
        for(const member of members) {
            const fetchedMember = await fetchedGuild.members.fetch(member.guild_uid);
        }

        res.end("Hello!");
    });

    const server = rest.listen(8081, function() {
        const host = (server.address() as AddressInfo).address;
        const port = (server.address() as AddressInfo).port;

        logger(`REST API started on http://${host}:${port}`);
    });
}).catch(error => logger(error, LoggerType.ERROR));