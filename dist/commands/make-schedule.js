"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeSchedule = void 0;
const builders_1 = require("@discordjs/builders");
const fs_1 = require("fs");
exports.MakeSchedule = {
    data: new builders_1.SlashCommandBuilder()
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
    run: async function (client, interaction) {
        await interaction.deferReply({ ephemeral: true });
        const buffer = JSON.parse((0, fs_1.readFileSync)("data/schedule.json", { encoding: 'utf-8' }));
        const day = interaction.options.get("day", true).value;
        const user = interaction.options.getMember("user");
        buffer[(day - 1).toString()] = user.id;
        (0, fs_1.writeFileSync)("data/schedule.json", JSON.stringify(buffer, undefined, "    "), { encoding: 'utf-8' });
        await interaction.followUp(`Assigned ${user.nickname} to day ${day}`);
    }
};
