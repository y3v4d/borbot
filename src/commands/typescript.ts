import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../core/bot";
import Command from "../core/command";

export const TypeScript: Command = {
    data: new SlashCommandBuilder()
        .setName("ts")
        .setDescription("What does it mean?"),

    run: async(client: Bot, interaction: BaseCommandInteraction) => {
        const msg = "Hi!\nI'm on Typescript now!";

        await interaction.reply(msg);
    }
}