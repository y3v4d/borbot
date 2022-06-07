"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChat = void 0;
const tslib_1 = require("tslib");
const guild_1 = tslib_1.__importDefault(require("../models/guild"));
const clan_1 = require("../shared/clan");
const member_1 = tslib_1.__importDefault(require("../models/member"));
const CHAT = '983503510479990785';
function composeDate(date) {
    return `${date.getUTCDate().toString().padStart(2, '0')}-` +
        `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-` +
        `${date.getUTCFullYear()} ` +
        `${date.getUTCHours().toString().padStart(2, '0')}:` +
        `${date.getUTCMinutes().toString().padStart(2, '0')}:` +
        `${date.getUTCSeconds().toString().padStart(2, '0')}`;
}
exports.UpdateChat = {
    run: async function (client) {
        console.log("#updateChat action");
        const allGuilds = await guild_1.default.find();
        for (const guild of allGuilds) {
            const fetched = await client.guilds.fetch(guild.guild_id);
            console.log(`---- Updating in ${fetched.name} ----`);
            if (!(await clan_1.ClanManager.test(guild.user_uid, guild.password_hash))) {
                console.error("Couldn't find clan with assigned credentials...");
                continue;
            }
            const clan = new clan_1.ClanManager(guild.user_uid, guild.password_hash);
            let timestamp = (guild.last_chat_update === undefined ? 0 : guild.last_chat_update);
            await clan.update();
            await clan.fetchMessages();
            const channel = await fetched.channels.fetch(CHAT);
            if (!channel || !channel.isText()) {
                console.error("Couldn't find valid chat channel!");
                continue;
            }
            for (let msg of clan.messages) {
                if (msg.timestamp > timestamp) {
                    let content = msg.content;
                    const chunks = content.split('@');
                    chunks.splice(0, (msg.content.startsWith('@') ? 0 : 1));
                    for (const chunk of chunks) {
                        console.log(`Chunk: ${chunk}`);
                        const word = chunk.split(' ', 1)[0];
                        if (word.length === 0)
                            continue;
                        if (word === "everyone" || word === "here")
                            continue;
                        console.log(`Word: ${word}`);
                        const clanMember = clan.getMemberByName(word);
                        if (!clanMember)
                            continue;
                        const memberModel = await member_1.default.findOne({ clan_uid: clanMember.uid });
                        if (!memberModel)
                            continue;
                        const guildMember = await fetched.members.fetch(memberModel.guild_uid);
                        if (!guildMember)
                            continue;
                        console.log("Fetched mention of " + guildMember.displayName);
                        content = content.replace('@' + word, `${guildMember}`);
                    }
                    const date = new Date(msg.timestamp * 1000);
                    await channel.send({
                        content: `**${clan.getMemberByUid(msg.uid)?.nickname} ${composeDate(date)}**\n${content}`
                    });
                    timestamp = msg.timestamp;
                }
            }
            guild.last_chat_update = timestamp;
            await guild.save();
        }
    },
    startOnInit: true,
    repeat: true,
    timeout: 60000 * 5
};
