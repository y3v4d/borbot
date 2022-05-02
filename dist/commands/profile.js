"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const clan_1 = require("../shared/clan");
const member_1 = tslib_1.__importDefault(require("../models/member"));
exports.Profile = {
    data: new builders_1.SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show beautiful profile from clicker heroes user data!")
        .addUserOption(input => input
        .setName("user")
        .setDescription("Optional: Select user you would like to see")
        .setRequired(false)),
    run: async function (client, interaction) {
        await client.clan.update();
        const user = interaction.options.getUser("user", false);
        const dbMember = await member_1.default.findOne({ guild_uid: (user ? user.id : interaction.user.id) });
        if (!dbMember) {
            await interaction.reply("You aren't mapped! Contact **y3v4d** :)");
            return;
        }
        const member = client.clan.getMemberByUid(dbMember.clan_uid);
        if (!member) {
            await interaction.reply({ content: "You're not defined as a clan member! Contact **y3v4d** :)", ephemeral: true });
            return;
        }
        const embed = new discord_js_1.MessageEmbed()
            .setColor("#0099ff")
            .setTitle(`Profile`)
            .setAuthor({ name: member.nickname, iconURL: (user ? user.avatarURL() : interaction.user.avatarURL()) })
            .addFields({ name: "Class", value: clan_1.ClanClass[member.class], inline: true }, { name: "Level", value: member.level.toString(), inline: true }, { name: "Highest Zone", value: member.highestZone.toLocaleString('en-US'), inline: true })
            .setImage('https://i.imgur.com/glzDw4P.gif')
            .setFooter({ text: "Composed by Mighty Borb", iconURL: client.user.avatarURL() });
        switch (member.class) {
            case clan_1.ClanClass.Mage:
                embed.setThumbnail("https://i.imgur.com/WR0ZE4i.png");
                break;
            case clan_1.ClanClass.Priest:
                embed.setThumbnail("https://i.imgur.com/dSjBg7M.png");
                break;
            case clan_1.ClanClass.Rogue:
                embed.setThumbnail("https://i.imgur.com/4aGoDnB.png");
                break;
            default: break;
        }
        await interaction.reply({ embeds: [embed] });
    }
};
