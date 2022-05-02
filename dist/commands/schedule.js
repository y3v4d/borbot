"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const MS_IN_DAY = 86400000;
exports.Schedule = {
    data: new builders_1.SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Show up-to-date schedule!"),
    run: async function (client, interaction) {
        const dbGuild = await guild_1.default
            .findOne({ guild_id: interaction.guildId })
            .populate({
            path: 'schedule',
            populate: {
                path: 'map',
                populate: {
                    path: 'member'
                }
            }
        });
        if (!dbGuild) {
            await interaction.reply("Guild isn't setuped!");
            return;
        }
        if (!dbGuild.schedule) {
            await interaction.reply("Schedule for the guild wasn't setuped!");
            return;
        }
        const dbSchedule = dbGuild.schedule;
        const startDate = new Date(dbSchedule.start_day);
        const endDate = new Date(startDate.getTime() + 10 * MS_IN_DAY);
        let msg = `**SCHEDULE ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        msg += `-${endDate.getUTCDate().toString().padStart(2, '0')}.${(endDate.getUTCMonth() + 1).toString().padStart(2, '0')}**\n`;
        let currentDate = startDate;
        for (let i = 0; i < 10; ++i) {
            msg += `${currentDate.getUTCDate().toString().padStart(2, '0')}.${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')} -> `;
            const dbScheduleMember = dbSchedule.map.find(o => o.index === (i + 1));
            if (dbScheduleMember) {
                msg += `**<@${dbScheduleMember.member.guild_uid}>**\n`;
            }
            else {
                msg += `**Noone**\n`;
            }
            currentDate = new Date(currentDate.getTime() + MS_IN_DAY);
        }
        await interaction.reply(msg);
    }
};
