"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScript = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const emojis_1 = tslib_1.__importDefault(require("../shared/emojis"));
exports.TypeScript = {
    data: new builders_1.SlashCommandBuilder()
        .setName("ts")
        .setDescription("What does it mean?"),
    run: async (client, interaction) => {
        const msg = emojis_1.default.makeEmojiMessage(interaction.guild, "Hi!\nIm on typescript now!");
        await interaction.reply(msg[0]);
    }
};
