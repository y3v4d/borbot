import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, MessageEmbed } from "discord.js";
import { ClanClass } from "../shared/clan";
import Bot from "../core/bot";
import Command from "../core/command";
import MemberModel from "../models/member";
import logger, { LoggerType } from "../shared/logger";
import GuildModel from "../models/guild";
import CH from "../api/clickerheroes";
import { addCommas } from "../shared/utils";



export const Profile: Command = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show beautiful profile from clicker heroes user data!")
        .addUserOption(input => input
            .setName("user")
            .setDescription("Optional: Select user you would like to see")
            .setRequired(false)),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        const guildId = interaction.guildId!;

        const dbGuild = await GuildModel.findOne({ guild_id: guildId });
        if(!dbGuild) {
            await interaction.reply({ 
                content: "Couldn't find guild in database...", 
                ephemeral: true 
            });

            return;
        }

        const clan = await CH.getGuildInfo(dbGuild.user_uid, dbGuild.password_hash);

        const user = interaction.options.getUser("user", false) || interaction.user;
        const dbMember = await MemberModel.findOne({ guild_uid: user.id });
        if(!dbMember) {
            logger(`/profile Couldn't find member with guild uid: ${user.id}`, LoggerType.ERROR);
            await interaction.reply({
                content: "You're not connected! Contact the guild administrator :)",
                ephemeral: true
            });

            return;
        }

        const member = Object.values(clan.guildMembers).find(o => o.uid === dbMember.clan_uid);
        if(!member) {
            logger(`/profile Couldn't find clan member with guild uid: ${user.id}`, LoggerType.ERROR);
            await interaction.reply({ 
                content: "You're not a clan member! Contact the guild administrator :)", 
                ephemeral: true 
            });

            return;
        }

        const embed = new MessageEmbed()
            .setColor("#5E81AC")
            .setTitle(`Profile`)
            .setAuthor({ name: member.nickname, iconURL: (user ? user.avatarURL()! : interaction.user!.avatarURL()!) })
            .addFields(
                { name: "Class", value: ClanClass[parseInt(member.chosenClass)], inline: true },
                { name: "Level", value: member.classLevel, inline: true },
                { name: "Highest Zone", value: addCommas(member.highestZone), inline: true }
            )
            .setImage('https://i.imgur.com/glzDw4P.gif')
            .setFooter({ text: "Composed by Mighty Borb", iconURL: client.user!.avatarURL()! });

        switch(parseInt(member.chosenClass)) {
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