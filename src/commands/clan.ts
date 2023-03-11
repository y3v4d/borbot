import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../core/bot";
import Command from "../core/command";
import table from "text-table";
import { addCommas } from "../shared/utils";
import ClanService, { ClanClass } from "../services/clanService";
import GuildService from "../services/guildService";

export const Clan: Command = {
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Replies with clan info!'),

    run: async(client: Bot, interaction: BaseCommandInteraction) => {
        const guildId = interaction.guildId!;

        const guild = await GuildService.getGuild(guildId);
        if(!guild) {
            await interaction.reply({ 
                content: "Guild isn't setup! Contact the admin.", 
                ephemeral: true 
            });

            return;
        }

        const clan = await ClanService.getClanInformation(guild.user_uid, guild.password_hash);
        if(!clan) {
            await interaction.reply({
                content: "Error retreiving clan data! Contact the admin.",
                ephemeral: true
            });

            return;
        }

        // clan name and immortal levels as a header
        let response = `**${clan.name}**\n**Immortals** [New: ${clan.currentNewRaidLevel - 1}, Legacy: ${clan.currentRaidLevel}]\n`;
        response += "\`\`\`";

        // sort guild members with highest zone and prepare for making table
        const formatted = clan.members
            .sort((a, b) => b.highestZone - a.highestZone)
            .map(x => [x.nickname, addCommas(x.highestZone), ClanClass[x.class], x.level.toString()]);

        response += table(
            [['Name', 'Highest Zone', 'Class', 'Level'], []].concat(formatted),
            { align: ['l', 'l', 'l', 'r'] }
        );

        response += '\`\`\`';

        await interaction.reply(response);
    }
}