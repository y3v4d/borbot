"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const emojis_1 = tslib_1.__importDefault(require("../shared/emojis"));
const PREFIX = "!";
exports.default = (client) => {
    client.on('messageCreate', async (msg) => {
        if (!msg.content.startsWith(PREFIX) || msg.author.bot)
            return;
        const cmd = msg.content.slice(PREFIX.length).trim().split(' ', 1)[0];
        const args = msg.content.slice(PREFIX.length + cmd.length).trim();
        if (cmd === 'send') {
            await msg.channel.sendTyping();
            const startMsg = `$$**${msg.member.displayName}** would like to say:$$ \n`;
            const built = emojis_1.default.makeEmojiMessage(msg.guild, startMsg + args);
            if (built.length === 0) {
                await msg.delete();
                await msg.channel.send(startMsg + args);
            }
            else {
                await msg.delete();
                for (let i = 0; i < built.length; ++i) {
                    await msg.channel.send(`${built[i]}`);
                }
            }
        }
    });
};
