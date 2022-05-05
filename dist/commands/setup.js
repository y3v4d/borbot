"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setup = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const clan_1 = require("../shared/clan");
exports.Setup = {
    data: new builders_1.SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup the Mighty Borb!")
        .setDefaultPermission(false)
        .addStringOption(input => input
        .setName('user_uid')
        .setDescription('User UID used to connect to the clicker heroes server.')
        .setRequired(true))
        .addStringOption(input => input
        .setName('user_hash')
        .setDescription('User password hash to connect to the clicker heroes server.')
        .setRequired(true)),
    run: async function (client, interaction) {
        if (await guild_1.default.exists({ guild_id: interaction.guildId })) {
            await interaction.reply("This guild was already setuped!");
            return;
        }
        const user_uid = interaction.options.get('user_uid').value;
        const user_hash = interaction.options.get('user_hash').value;
        if (!(await clan_1.ClanManager.test(user_uid, user_hash))) {
            await interaction.reply("The user with specified UID and password cannot connect to servers... Double check the values!");
            return;
        }
        const schema = {
            guild_id: interaction.guildId,
            user_uid: user_uid,
            password_hash: user_hash
        };
        await (new guild_1.default(schema)).save();
        await interaction.reply("Successfully setuped the guild!");
    }
};
