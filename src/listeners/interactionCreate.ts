import { Interaction } from "discord.js";
import Bot from "../core/bot";
import { Commands } from "../commands";

export default (client: Bot): void => {
    client.on('interactionCreate', async (interaction: Interaction) => {
        if(!interaction.isCommand()) return;

        const cmd = Commands.find(c => c.data.name === interaction.commandName);
        if(!cmd) {
            interaction.reply({
                content: "Couldn't find command runner...",
                ephemeral: true
            });

            return;
        }
        
        cmd.run(client, interaction);
    });
}

