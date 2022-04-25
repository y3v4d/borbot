import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../core/bot";
import Command from "../core/command";
import Emoji from "../shared/emojis";

export const TypeScript: Command = {
    data: new SlashCommandBuilder()
        .setName("ts")
        .setDescription("What does it mean?"),

    run: async(client: Bot, interaction: BaseCommandInteraction) => {
        const msg = Emoji.makeEmojiMessage(interaction.guild!, "Hi!\nIm on typescript now!");

        await interaction.reply(msg[0]);
    }
}