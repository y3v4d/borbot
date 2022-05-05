import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import ScheduleModel, { ISchedule } from "../models/schedule";
import Bot from "../core/bot";
import Command from "../core/command";
import GuildModel from "../models/guild";

export const RemoveSchedule: Command = {
    data: new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName("remove-schedule")
        .setDescription("Removes member from the specified date!")
        .addIntegerOption(input => input
            .setName("day")
            .setDescription("Day of the cycle")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true)),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        const day = interaction.options.get("day", true)!.value! as number;

        const dbGuild = (await GuildModel.findOne({ guild_id:  interaction.guildId! })!.populate<{ schedule: ISchedule }>('schedule'))!;
        const dbSchedule = dbGuild.schedule;

        const entryIndex = dbSchedule.map.findIndex(o => o.index == day);
        if(entryIndex < 0) {
            await interaction.reply({ content: "Can't find user!", ephemeral: true });
            return;
        }

        dbSchedule.map.splice(entryIndex, 1);
        await ScheduleModel.updateOne(dbSchedule);
        await interaction.reply({ content: "Done!", ephemeral: true });
    }
}