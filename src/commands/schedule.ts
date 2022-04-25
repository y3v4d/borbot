import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import { readFileSync } from "fs";
import Bot from "../core/bot";
import Command from "../core/command";

const MS_IN_DAY = 86400000;

interface ScheduleJSON {
    startDay: "string",
    length: number,
    map: { [key: string]: string }
}

export const Schedule: Command = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Show up-to-date schedule!"),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        let schedule: ScheduleJSON;
        try {
            schedule = JSON.parse(readFileSync("data/schedule.json", { encoding: 'utf-8' })) as ScheduleJSON;
        } catch(e) {
            interaction.reply({ content: "Schedule doesn't exist! Ask y3v4d to create one :)", ephemeral: true });
            return;
        }

        const guild = await client.guilds.fetch(process.env.GUILD_ID!);

        const startDate = new Date(schedule.startDay);
        const endDate = new Date(startDate.getTime() + 10 * MS_IN_DAY);

        let msg = `**SCHEDULE ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        msg += `-${endDate.getUTCDate().toString().padStart(2, '0')}.${(endDate.getUTCMonth() + 1).toString().padStart(2, '0')}**\n`;
        let currentDate = startDate;
        for(let i = 0; i < 9; ++i) {
            let id = schedule.map[i.toString()];
            const member = await guild.members.fetch(id);

            msg += `${currentDate.getUTCDate().toString().padStart(2, '0')}.${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')} -> **${member.nickname}**\n`;
            currentDate = new Date(currentDate.getTime() + MS_IN_DAY);
        }

        await interaction.reply(msg);
    }
}