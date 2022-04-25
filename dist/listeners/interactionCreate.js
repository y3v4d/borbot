"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commands_1 = require("../commands");
exports.default = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand())
            return;
        const cmd = commands_1.Commands.find(c => c.data.name === interaction.commandName);
        if (!cmd) {
            interaction.reply({
                content: "An error has occurred...",
                ephemeral: true
            });
            return;
        }
        cmd.run(client, interaction);
    });
};
