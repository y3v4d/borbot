import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import Bot from "../core/bot";
import Command from "../core/command";
import table from "text-table";
import { ClanClass } from "../shared/clan";
import GuildModel from "../models/guild";
import ClickerHeroesAPI from "../api/clickerheroes";
import { addCommas } from "../shared/utils";

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

        const clan = await ClickerHeroesAPI.getGuildInfo(dbGuild.user_uid, dbGuild.password_hash);

        // clan name and immortal levels as a header
        let response = `**${clan.guild.name}**\n**Immortals** [New: ${clan.guild.currentNewRaidLevel - 1}, Legacy: ${clan.guild.currentRaidLevel}]\n`;
        response += "\`\`\`";

        // sort guild members with highest zone and prepare for making table
        const formatted = Object.values(clan.guildMembers)
            .sort((a, b) => parseInt(b.highestZone) - parseInt(a.highestZone))
            .map(x => [x.nickname, addCommas(x.highestZone), ClanClass[parseInt(x.chosenClass)], x.classLevel]);

        response += table(
            [['Name', 'Highest Zone', 'Class', 'Level'], []].concat(formatted),
            { align: ['l', 'l', 'l', 'r'] }
        );

        response += '\`\`\`';

        await interaction.reply(response);
    }
}