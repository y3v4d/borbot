"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connect = void 0;
const builders_1 = require("@discordjs/builders");
const fs_1 = require("fs");
const updateUsers_1 = require("../actions/updateUsers");
exports.Connect = {
    data: new builders_1.SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect your discord profile to clan profile!')
        .setDefaultPermission(false)
        .addUserOption(option => option
        .setName('guild_user')
        .setDescription('The discord user to connect')
        .setRequired(true))
        .addStringOption(input => input
        .setName('clan_name')
        .setDescription('Clicker Heroes name')
        .setRequired(true)),
    run: async function (client, interaction) {
        await interaction.deferReply({ ephemeral: true });
        await client.clan.update();
        const buffer = (0, fs_1.readFileSync)("data/userMap.json", { encoding: 'utf-8', });
        const map = JSON.parse(buffer);
        const clan_name = interaction.options.get('clan_name').value;
        const guild_user = interaction.options.get('guild_user').user;
        if (guild_user.bot) {
            await interaction.followUp("Did you just try to assign something to the mighty Borb?!");
            return;
        }
        const clan_member = client.clan.getMemberByName(clan_name);
        if (!clan_member) {
            await interaction.followUp(`Couldn't find user with name ${clan_name} in the clan...`);
            return;
        }
        map[guild_user.id] = clan_member.uid;
        (0, fs_1.writeFileSync)("data/userMap.json", JSON.stringify(map, undefined, "    "), { encoding: 'utf-8' });
        await interaction.followUp(`Assigned ${guild_user.username} to ${clan_name}!`);
        await updateUsers_1.UpdateUsers.run(client);
    }
};
