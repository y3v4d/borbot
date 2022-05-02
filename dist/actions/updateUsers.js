"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUsers = void 0;
const tslib_1 = require("tslib");
const member_1 = tslib_1.__importDefault(require("../models/member"));
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const clan_1 = require("../shared/clan");
exports.UpdateUsers = {
    timeout: 60000 * 60,
    startOnInit: true,
    repeat: true,
    async run(client) {
        console.log("#updateUsers action");
        const allGuilds = await guild_1.default.find();
        for (const guild of allGuilds) {
            const fetched = await client.guilds.fetch(guild.guild_id);
            console.log(`---- Updating in ${fetched.name} ----`);
            const clanManager = new clan_1.ClanManager(guild.user_uid, guild.password_hash);
            await clanManager.update();
            const members = await member_1.default.find({ guild_id: guild.guild_id });
            for (const member of members) {
                const clanMember = clanManager.getMemberByUid(member.clan_uid);
                const dcMember = await fetched.members.fetch(member.guild_uid);
                if (dcMember.manageable) {
                    await dcMember.setNickname(`${clanMember.nickname} [${clanMember.level}]`);
                }
                else {
                }
            }
        }
    }
};
