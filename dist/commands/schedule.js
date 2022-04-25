"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
const builders_1 = require("@discordjs/builders");
const fs_1 = require("fs");
const MS_IN_DAY = 86400000;
exports.Schedule = {
    data: new builders_1.SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Show up-to-date schedule!"),
    run: async function (client, interaction) {
        let schedule;
        try {
            schedule = JSON.parse((0, fs_1.readFileSync)("data/schedule.json", { encoding: 'utf-8' }));
        }
        catch (e) {
            interaction.reply({ content: "Schedule doesn't exist! Ask y3v4d to create one :)", ephemeral: true });
            return;
        }
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const startDate = new Date(schedule.startDay);
        const endDate = new Date(startDate.getTime() + 10 * MS_IN_DAY);
        let msg = `**SCHEDULE ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        msg += `-${endDate.getUTCDate().toString().padStart(2, '0')}.${(endDate.getUTCMonth() + 1).toString().padStart(2, '0')}**\n`;
        let currentDate = startDate;
        for (let i = 0; i < 9; ++i) {
            let id = schedule.map[i.toString()];
            const member = await guild.members.fetch(id);
            msg += `${currentDate.getUTCDate().toString().padStart(2, '0')}.${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')} -> **${member.nickname}**\n`;
            currentDate = new Date(currentDate.getTime() + MS_IN_DAY);
        }
        await interaction.reply(msg);
    }
};
