import 'dotenv/config';

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Commands } from "./bot/commands";

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
const commandsData = Commands.map(c => c.data.toJSON());

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.APP_ID!, process.env.GUILD_ID!),
            { body: commandsData }
        );

        console.log('Registered local commands!');
    } catch(error) {
        console.error(error);
    }
})();