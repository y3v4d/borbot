"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveSchedule = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const schedule_1 = tslib_1.__importDefault(require("../models/schedule"));
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
exports.RemoveSchedule = {
    data: new builders_1.SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName("remove-schedule")
        .setDescription("Removes member from the specified date!")
        .addIntegerOption(input => input
        .setName("day")
        .setDescription("Day of the cycle")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)),
    run: async function (client, interaction) {
        const day = interaction.options.get("day", true).value;
        const dbGuild = (await guild_1.default.findOne({ guild_id: interaction.guildId }).populate('schedule'));
        const dbSchedule = dbGuild.schedule;
        const entryIndex = dbSchedule.map.findIndex(o => o.index == day);
        if (entryIndex < 0) {
            await interaction.reply({ content: "Can't find user!", ephemeral: true });
            return;
        }
        dbSchedule.map.splice(entryIndex, 1);
        await schedule_1.default.updateOne(dbSchedule);
        await interaction.reply({ content: "Done!", ephemeral: true });
    }
};
