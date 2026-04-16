import 'dotenv/config';

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Commands } from "./bot/commands";

const rest = new REST().setToken(process.env.BOT_TOKEN!);
const commandsData = Commands.map(c => c.data.toJSON());

(async () => {
    if(process.argv.length < 3) {
        console.error("Please provide guild id as an argument!");
        return;
    }

    const guildId = process.argv[2];
    if(!guildId) {
        console.error("Please provide guild id as an argument!");
        return;
    }

    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.APP_ID!, guildId),
            { body: commandsData }
        );

        console.log('Registered local commands!');
    } catch(error) {
        console.error(error);
    }
})();