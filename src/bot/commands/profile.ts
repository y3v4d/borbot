import { SlashCommandBuilder } from "@discordjs/builders";
import Bot from "../client";
import Command from "../core/command";
import logger, { LoggerType } from "../../shared/logger";
import { addCommas } from "../../shared/utils";
import ClanService, { ClanClass } from "../../services/clanService";
import GuildService from "../../services/guildService";
import { CommandInteraction, EmbedBuilder } from "discord.js";

export const Profile: Command = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show beautiful profile from clicker heroes user data!")
        .addUserOption(input => input
            .setName("user")
            .setDescription("Optional: Select user you would like to see")
            .setRequired(false)),

    run: async function(client: Bot, interaction: CommandInteraction) {
        const guildId = interaction.guildId!;

        const guild = await GuildService.getGuild(guildId);
        if(!guild) {
            await interaction.reply({ 
                content: "Guild isn't setup! Contact the administrator.", 
                ephemeral: true 
            });

            return;
        }

        const clan = await ClanService.getClanInformation(guild.user_uid, guild.password_hash);
        if(!clan) {
            await interaction.reply({
                content: "Couldn't get clan information! Contact the administrator.",
                ephemeral: true
            });

            return;
        }

        const user = interaction.options.getUser("user", false) || interaction.user;
        const connected = await GuildService.getGuildConnectedMember({ guild_id: guildId, guild_uid: user.id });
        if(!connected) {
            logger(`/profile Couldn't find connected member with guild uid: ${user.id}`, LoggerType.ERROR);
            await interaction.reply({
                content: "Selected user is not connected! Contact the guild administrator :)",
                ephemeral: true
            });

            return;
        }

        const member = clan.members.find(o => o.uid === connected.clan_uid);
        if(!member) {
            logger(`/profile Couldn't find clan member with guild uid: ${user.id}`, LoggerType.ERROR);
            await interaction.reply({ 
                content: "You're not a clan member! Contact the guild administrator :)", 
                ephemeral: true 
            });

            return;
        }

        const embed = new EmbedBuilder()
            .setColor("#5E81AC")
            .setTitle(`Profile`)
            .setAuthor({ name: member.nickname, iconURL: (user.avatarURL() || "") })
            .addFields(
                { name: "Class", value: ClanClass[member.class], inline: true },
                { name: "Level", value: member.level.toString(), inline: true },
                { name: "Highest Zone", value: addCommas(member.highestZone), inline: true }
            )
            .setImage('https://i.imgur.com/glzDw4P.gif')
            .setFooter({ text: "Composed by Mighty Borb", iconURL: client.user?.avatarURL() || "" });

        switch(member.class) {
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