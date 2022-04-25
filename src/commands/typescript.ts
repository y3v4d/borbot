import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, Client } from "discord.js";
import Bot from "../shared/bot";
import Command from "../shared/command";
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