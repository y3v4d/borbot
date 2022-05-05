"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clan = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const text_table_1 = tslib_1.__importDefault(require("text-table"));
const clan_1 = require("../shared/clan");
exports.Clan = {
    data: new builders_1.SlashCommandBuilder()
        .setName('clan')
        .setDescription('Replies with clan info!'),
    run: async (client, interaction) => {
        await client.clan.update();
        let response = `**${client.clan.name}**\n**Immortals** [New: ${client.clan.newRaidLevel - 1}, Legacy: ${client.clan.legacyRaidLevel}]\n`;
        response += "\`\`\`";
        const formatted = client.clan.getAllMembers()
            .sort((a, b) => b.highestZone - a.highestZone)
            .map(x => [x.nickname, x.highestZone.toString(), clan_1.ClanClass[x.class], x.level.toString()]);
        response += (0, text_table_1.default)([['Name', 'Highest Zone', 'Class', 'Level'], []].concat(formatted), { align: ['l', 'l', 'l', 'r'] });
        response += '\`\`\`';
        await interaction.reply(response);
    }
};
