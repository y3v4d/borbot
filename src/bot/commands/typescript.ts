import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import Bot from "../client";
import Command from "../core/command";

export const TypeScript: Command = {
    data: new SlashCommandBuilder()
        .setName("ts")
        .setDescription("What does it mean?"),

    run: async(client: Bot, interaction: CommandInteraction) => {
        const msg = "Hi!\nI'm on Typescript now!";

        await interaction.reply(msg);
    }
}