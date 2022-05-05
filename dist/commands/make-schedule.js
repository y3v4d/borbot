"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeSchedule = void 0;
const tslib_1 = require("tslib");
const builders_1 = require("@discordjs/builders");
const schedule_1 = tslib_1.__importDefault(require("../models/schedule"));
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const member_1 = tslib_1.__importDefault(require("../models/member"));
exports.MakeSchedule = {
    data: new builders_1.SlashCommandBuilder()
        .setName("make-schedule")
        .setDescription("Assign people to schedule.")
        .setDefaultPermission(false)
        .addIntegerOption(input => input
        .setName("day")
        .setDescription("Day of the schedule (1-10)")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true))
        .addStringOption(input => input
        .setName("clan_user")
        .setDescription("Clan user name that will be assigned to that day.")
        .setRequired(true)),
    run: async function (client, interaction) {
        await interaction.deferReply({ ephemeral: true });
        await client.clan.update();
        const clan_user = interaction.options.get('clan_user', true).value;
        const day = interaction.options.get('day', true).value;
        const dbGuild = await guild_1.default.findOne({ guild_id: interaction.guildId });
        if (!dbGuild) {
            await interaction.followUp("Guild wasn't setuped!");
            return;
        }
        if (!dbGuild.schedule) {
            await interaction.followUp("Schedule wasn't setuped!");
            return;
        }
        const dbSchedule = (await schedule_1.default.findById(dbGuild.schedule));
        const clanMember = client.clan.getMemberByName(clan_user);
        if (!clanMember) {
            await interaction.followUp(`Clan member with ${clan_user} name doesn't exists!`);
            return;
        }
        const dbMember = await member_1.default.findOne({ clan_uid: clanMember.uid });
        if (!dbMember) {
            await interaction.followUp(`Clan member is not connected to any discord user!`);
            return;
        }
        const dbEntry = dbSchedule.map.find((o) => o.index === day);
        if (!dbEntry) {
            dbSchedule.map.push({
                member: dbMember._id,
                index: day
            });
        }
        else {
            dbEntry.member = dbMember.id;
        }
        await dbSchedule.save();
        await interaction.followUp(`Assigned <@${dbMember.guild_uid}> to ${day} day of the cycle!`);
    }
};
