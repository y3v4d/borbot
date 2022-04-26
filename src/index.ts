import 'dotenv/config';
import { Intents } from "discord.js";

import ready from './listeners/ready';
import interactionCreate from './listeners/interactionCreate';
import message from './listeners/message';
import Bot from './core/bot';
import mongoose from 'mongoose';

interface IGuild {
    guild_id: string,
    admin_role: string,

    user_uid: string,
    password_hash: string
}

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
    console.log("Connected!");

    const guildSchema = new mongoose.Schema<IGuild>({
        guild_id: { type: String, required: true },
        admin_role: { type: String, required: true },

        user_uid: { type: String, required: true },
        password_hash: { type: String, required: true }
    });

    const Guild = mongoose.model<IGuild>('Guild', guildSchema);

    const guild = new Guild({
        guild_id: "guild_id",
        admin_role: "admin_role",

        user_uid: "user_id",
        password_hash: "password_hash"
    });
}).catch(error => console.error(error));

console.log("Bot is starting...");
const client = new Bot({
     intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, 
        Intents.FLAGS.GUILD_MEMBERS
    ]}, process.env.USER_UID!, process.env.HASH!);

ready(client);
interactionCreate(client);
message(client);

client.login(process.env.TOKEN);