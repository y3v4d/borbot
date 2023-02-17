import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../core/bot";
import Command from "../core/command";
import table from "text-table";
import GuildModel from "../models/guild";
import { addCommas } from "../shared/utils";
import { ClanClass } from "../services/clanService";

export const Clan: Command = {
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Replies with clan info!'),

    run: async(client: Bot, interaction: BaseCommandInteraction) => {
        const guildId = interaction.guildId!;

        const dbGuild = await GuildModel.findOne({ guild_id: guildId });
        if(!dbGuild) {
            await interaction.reply({ 
                content: "Couldn't find guild in database...", 
                ephemeral: true 
            });

            return;
        }

        const clan = await client.clanService.getClanInformation(dbGuild.user_uid, dbGuild.password_hash);

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