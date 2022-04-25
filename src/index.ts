import 'dotenv/config';
import { Intents } from "discord.js";

import ready from './listeners/ready';
import interactionCreate from './listeners/interactionCreate';
import message from './listeners/message';
import Bot from './core/bot';

console.log("Bot is starting...");
const client = new Bot({
     intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, 
        Intents.FLAGS.GUILD_MEMBERS
    ]}, process.env.UID!, process.env.HASH!);

ready(client);
interactionCreate(client);
message(client);

client.login(process.env.TOKEN);