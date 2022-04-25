import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, GuildMember } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import Bot from "../core/bot";
import Command from "../core/command";

export const MakeSchedule: Command = {
    data: new SlashCommandBuilder()
        .setName("make-schedule")
        .setDescription("Assign people to schedule.")
        .setDefaultPermission(false)
        .addIntegerOption(input => input
            .setName("day")
            .setDescription("Day of the schedule (1-10)")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true))
        .addUserOption(input => input
            .setName("user")
            .setDescription("User that will be assigned to that day.")
            .setRequired(true)),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const buffer = JSON.parse(readFileSync("data/schedule.json", { encoding: 'utf-8' })) as { [key: string]: string };

        const day = interaction.options.get("day", true).value as number;
        const user = interaction.options.getMember("user") as GuildMember;
        
        buffer[(day - 1).toString()] = user.id;

        writeFileSync("data/schedule.json", JSON.stringify(buffer, undefined, "    "), { encoding: 'utf-8' });
        await interaction.followUp(`Assigned ${user.nickname} to day ${day}`);
    }
}