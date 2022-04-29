import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import GuildModel from "../models/guild";
import Bot from "../core/bot";
import Command from "../core/command";
import ScheduleModel from "../models/schedule";

export const SetupSchedule: Command = {
    data: new SlashCommandBuilder()
        .setName('setup-schedule')
        .setDescription('Setup schedule date and length!')
        .addStringOption(input => input
            .setName('date')
            .setDescription("Date of the beginning of the most recent cycle.")
            .setRequired(true)),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        const guildDB = await GuildModel.findOne({ guild_id: interaction.guildId! });//.populate<{ schedule: ISchedule }>('schedule');
        if(!guildDB) {
            await interaction.reply(`This guild wasn't setuped!`);
            return;
        }

        const date = interaction.options.get('date')!.value! as string;

        let dbSchedule;
        if(!guildDB.schedule) {
            dbSchedule = new ScheduleModel({
                start_day: date,
                length: 10
            });

            await dbSchedule.save();
            guildDB.schedule = dbSchedule._id;
            await guildDB.save();
        } else {
            await ScheduleModel.findByIdAndUpdate(guildDB.schedule!._id, {
                start_day: date
            });
        }
    }
};