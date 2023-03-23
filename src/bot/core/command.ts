import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../client";

export default interface Command {
    data: Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">,
    run: (client: Bot, interaction: BaseCommandInteraction) => Promise<void>
}