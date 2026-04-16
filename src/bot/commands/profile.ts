import { SlashCommandBuilder } from "@discordjs/builders";
import Bot from "../client";
import Command from "../core/command";
import logger, { LoggerType } from "../../shared/logger";
import { addCommas, getClanRoleName } from "../../shared/utils";
import { ClanClass } from "../../services/clan.service";
import { CommandInteraction, EmbedBuilder } from "discord.js";

export const Profile: Command = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show beautiful profile from clicker heroes user data!")
        .addUserOption(input => input
            .setName("user")
            .setDescription("Optional: Select user you would like to see")
            .setRequired(false)),

    run: async function(bot: Bot, interaction: any) {
        const { guildService, clanService } = bot;
        const guildId = interaction.guildId!;

        const guild = await guildService.getGuild(guildId);
        if(!guild) {
            await interaction.reply({ 
                content: "Guild isn't setup! Contact the administrator.", 
                ephemeral: true 
            });

            return;
        }

        const user = interaction.options.getUser("user", false) || interaction.user;
        const member = await guildService.getGuildMemberByDiscordUID(guildId, user.id);
        if(!member) {
            logger(`/profile Couldn't find connected member with guild uid: ${user.id}`, LoggerType.ERROR);
            await interaction.reply({
                content: "Selected user is not connected! Contact the guild administrator :)",
                ephemeral: true
            });

            return;
        }

        const roleName = getClanRoleName(member.role);

        const embed = new EmbedBuilder()
            .setColor("#5E81AC")
            .setTitle(`Profile`)
            .setAuthor({ name: member.nickname, iconURL: (user.avatarURL() || "") })
            .addFields(
                { name: "Class", value: roleName, inline: true },
                { name: "Level", value: member.level?.toString() || "N/A", inline: true },
                { name: "Highest Zone", value: addCommas(member.highest_zone), inline: true }
            )
            .setImage('https://i.imgur.com/glzDw4P.gif')
            .setFooter({ text: "Composed by Mighty Borb", iconURL: bot.client.user?.avatarURL() || "" });

        switch(member.role) {
            case ClanClass.Mage:
                embed.setThumbnail("https://i.imgur.com/WR0ZE4i.png");
                break;
            case ClanClass.Priest:
                embed.setThumbnail("https://i.imgur.com/dSjBg7M.png");
                break;
            case ClanClass.Rogue:
                embed.setThumbnail("https://i.imgur.com/4aGoDnB.png");
                break;
            default: break;
        }

        await interaction.reply({ embeds: [embed] });
    }
}