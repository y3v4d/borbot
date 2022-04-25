import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../shared/bot";
import table from "text-table";
import Command from "../shared/command";
import { ClanClass } from "../shared/clan";

export const Clan: Command = {
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Replies with clan info!'),

    run: async(client: Bot, interaction: BaseCommandInteraction) => {
        await client.clan.update();

        // clan name and immortal levels as a header
        let response = `**${client.clan.name}**\n**Immortals** [New: ${client.clan.newRaidLevel - 1}, Legacy: ${client.clan.legacyRaidLevel}]\n`;
        response += "\`\`\`";

        // sort guild members with highest zone and prepare for making table
        const formatted = client.clan.getAllMembers()
            .sort((a, b) => b.highestZone - a.highestZone)
            .map(x => [x.nickname, x.highestZone.toString(), ClanClass[x.class], x.level.toString()]);

        response += table(
            [['Name', 'Highest Zone', 'Class', 'Level'], []].concat(formatted),
            { align: ['l', 'l', 'l', 'r'] }
        );

        response += '\`\`\`';

        await interaction.reply(response);
    }
}