"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const actions_1 = require("../actions");
const commands_1 = require("../commands");
const emojis_1 = tslib_1.__importDefault(require("../shared/emojis"));
const clan_1 = require("../shared/clan");
class Bot extends discord_js_1.Client {
    clan;
    constructor(options, uid, passwordHash) {
        super(options);
        this.clan = new clan_1.ClanManager(uid, passwordHash);
        this.on('ready', this.onReady.bind(this));
        this.on('interactionCreate', this.onInteractionCreate.bind(this));
        this.on('messageCreate', this.onMessageCreate.bind(this));
    }
    async onInteractionCreate(interaction) {
        if (!interaction.isCommand())
            return;
        const cmd = commands_1.Commands.find(c => c.data.name === interaction.commandName);
        if (!cmd) {
            await interaction.reply({
                content: "Couldn't find command runner...",
                ephemeral: true
            });
            return;
        }
        await cmd.run(this, interaction);
    }
    async onReady() {
        if (!this.user || !this.application) {
            console.error("User or application aren't initialized!");
            return;
        }
        actions_1.Actions.forEach(action => {
            if (action.repeat)
                setInterval(() => action.run(this), action.timeout);
            else
                setTimeout(() => action.run(this), action.timeout);
            if (action.startOnInit)
                action.run(this);
        });
    }
    async onMessageCreate(msg) {
        const PREFIX = "!";
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
    }
}
exports.default = Bot;
