import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ApplicationCommandPermissionData, Client } from "discord.js";
import Bot from "../core/bot";
import { Actions } from "../actions";
import { Commands } from "../commands";

export default (client: Bot): void => {
    client.on('ready', async () => {
        if(!client.user || !client.application) return;

        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN!);
        const commandsData = Commands.map(c => c.data.toJSON());

        await rest.put(
            Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID!),
            { body: commandsData }
        ).then(() => console.log('Registered commands!'))
        .catch(error => console.error(error));

        console.log(`${client.user.username} is online!`);

        (await client.guilds.cache.get(process.env.GUILD_ID!)!.commands.fetch()).forEach(async cmd => {
            if(!cmd.defaultPermission) {
                const permissions: ApplicationCommandPermissionData[] = [{
                    id: process.env.ADMIN_ROLE!,
                    type: 'ROLE',
                    permission: true
                }];
        
                await cmd.permissions.set({ permissions });
            }
        });

        Actions.forEach(action => {
            if(action.repeat) setInterval(() => action.run(client), action.timeout);
            else setTimeout(() => action.run(client), action.timeout);

            if(action.startOnInit) action.run(client);
        });
    });
}