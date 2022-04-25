"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const actions_1 = require("../actions");
const commands_1 = require("../commands");
exports.default = (client) => {
    client.on('ready', async () => {
        if (!client.user || !client.application)
            return;
        const rest = new rest_1.REST({ version: '9' }).setToken(process.env.TOKEN);
        const commandsData = commands_1.Commands.map(c => c.data.toJSON());
        await rest.put(v9_1.Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commandsData }).then(() => console.log('Registered commands!'))
            .catch(error => console.error(error));
        console.log(`${client.user.username} is online!`);
        (await client.guilds.cache.get(process.env.GUILD_ID).commands.fetch()).forEach(async (cmd) => {
            if (!cmd.defaultPermission) {
                const permissions = [{
                        id: process.env.ADMIN_ROLE,
                        type: 'ROLE',
                        permission: true
                    }];
                await cmd.permissions.set({ permissions });
            }
        });
        actions_1.Actions.forEach(action => {
            if (action.repeat)
                setInterval(() => action.run(client), action.timeout);
            else
                setTimeout(() => action.run(client), action.timeout);
            if (action.startOnInit)
                action.run(client);
        });
    });
};
