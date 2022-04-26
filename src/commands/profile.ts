import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, MessageEmbed } from "discord.js";
import { readFileSync } from "fs";
import { ClanClass } from "../shared/clan";
import Bot from "../core/bot";
import Command from "../core/command";

export const Profile: Command = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show beautiful profile from clicker heroes user data!")
        .addUserOption(input => input
            .setName("user")
            .setDescription("Optional: Select user you would like to see")
            .setRequired(false)),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        await client.clan.update();

        let userMap: { [key: string]: string } = {};
        try {
            userMap = JSON.parse(readFileSync("data/userMap.json", { encoding: 'utf-8' }));
        } catch(e) {
            await interaction.reply({ content: "Users aren't mapped! Contact **y3v4d** :)", ephemeral: true });
            return;
        }

        const user = interaction.options.getUser("user", false);
        const member = client.clan.getMemberByUid(userMap[(user ? user.id : interaction.user.id)]);
        if(!member) {
            await interaction.reply({ content: "You're not defined as a clan member! Contact **y3v4d** :)", ephemeral: true });
            return;
        }

        const embed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle(`Profile`)
            .setAuthor({ name: member.nickname, iconURL: (user ? user.avatarURL()! : interaction.user!.avatarURL()!) })
            .addFields(
                { name: "Class", value: ClanClass[member.class], inline: true },
                { name: "Level", value: member.level.toString(), inline: true },
                { name: "Highest Zone", value: member.highestZone.toLocaleString('en-US'), inline: true }
            )
            .setImage('https://i.imgur.com/glzDw4P.gif')
            .setFooter({ text: "Composed by Mighty Borb", iconURL: client.user!.avatarURL()! });

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

        interaction.reply({ embeds: [embed] });
    }
}