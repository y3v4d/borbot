import { Interaction } from "discord.js";
import Bot from "../core/bot";
import { Commands } from "../commands";

export default (client: Bot): void => {
    client.on('interactionCreate', async (interaction: Interaction) => {
        if(!interaction.isCommand()) return;

        const cmd = Commands.find(c => c.data.name === interaction.commandName);
        if(!cmd) {
            interaction.reply({
                content: "An error has occurred...",
                ephemeral: true
            });

            return;
        }
        
        cmd.run(client, interaction);
    });
}

