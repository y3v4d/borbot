"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupSchedule = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const schedule_1 = tslib_1.__importDefault(require("../models/schedule"));
exports.SetupSchedule = {
    data: new builders_1.SlashCommandBuilder()
        .setName('setup-schedule')
        .setDescription('Setup schedule date and length!')
        .setDefaultPermission(false)
        .addStringOption(input => input
        .setName('date')
        .setDescription("Date of the beginning of the most recent cycle.")
        .setRequired(true)),
    run: async function (client, interaction) {
        const guildDB = await guild_1.default.findOne({ guild_id: interaction.guildId });
        if (!guildDB) {
            await interaction.reply(`This guild wasn't setuped!`);
            return;
        }
        const date = interaction.options.get('date').value;
        let dbSchedule;
        if (!guildDB.schedule) {
            dbSchedule = new schedule_1.default({
                start_day: date,
                length: 10
            });
            await dbSchedule.save();
            guildDB.schedule = dbSchedule._id;
            await guildDB.save();
        }
        else {
            await schedule_1.default.findByIdAndUpdate(guildDB.schedule._id, {
                start_day: date
            });
        }
        await interaction.reply(`Setuped schedule!`);
    }
};
