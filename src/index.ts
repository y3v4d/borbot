import 'dotenv/config';
import { Client, GatewayIntentBits } from "discord.js";

import Bot from './bot/client';
import mongoose from 'mongoose';
import logger, { LoggerType } from './shared/logger';
import createServer from './server/server';
import ClanService from './services/clan.service';
import GuildService from './services/guild.service';
import UserService from './services/user.service';

async function main() {
    try {
        const PORT = process.env.PORT || 3010;

        await mongoose.connect(process.env.MONGODB_URI!);

        logger("MongoDB Connected!");
        logger("Bot is starting...");

        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildExpressions,
                GatewayIntentBits.GuildMembers
            ]
        });

        client.once('clientReady', async () => {
            const userService = new UserService();
            const clanService = new ClanService();
            const guildService = new GuildService();

            const bot = new Bot(client, guildService, clanService);
            await bot.launch();

            const api = createServer(bot, userService, guildService, clanService);
            api.listen(PORT, () => {
                logger(`Started REST API on port ${PORT}.`);
            });
        })

        await client.login(process.env.BOT_TOKEN);
        logger("Bot logged in!");
    } catch(error: any) {
        logger(error, LoggerType.ERROR);
    }
}

main();