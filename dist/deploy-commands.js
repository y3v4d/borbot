"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const commands_1 = require("./commands");
const rest = new rest_1.REST({ version: '9' }).setToken(process.env.TOKEN);
const commandsData = commands_1.Commands.map(c => c.data.toJSON());
(async () => {
    try {
        await rest.put(v9_1.Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID), { body: commandsData });
        console.log('Registered local commands!');
    }
    catch (error) {
        console.error(error);
    }
})();
