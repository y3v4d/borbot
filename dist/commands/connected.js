"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connected = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const member_1 = tslib_1.__importDefault(require("../models/member"));
exports.Connected = {
    data: new builders_1.SlashCommandBuilder()
        .setName("connected")
        .setDescription("List guild members connected to clan accounts")
        .setDefaultPermission(false),
    run: async function (client, interaction) {
        await interaction.deferReply({ ephemeral: true });
        await client.clan.update();
        const guild = interaction.guild;
        const results = await member_1.default.find({
            guild_id: guild.id
        });
        let msg = "**Connected users**:\n";
        for (const result of results) {
            msg += "**";
            msg += (await guild.members.fetch(result.guild_uid)).nickname;
            msg += ` -> ${client.clan.getMemberByUid(result.clan_uid).nickname}`;
            msg += "**\n";
        }
        await interaction.followUp(msg);
    }
};
