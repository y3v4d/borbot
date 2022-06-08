import { Client, ClientOptions, Interaction, Message } from "discord.js";
import { Actions } from "../actions";
import { Commands } from "../commands";
import Emoji from "../shared/emojis";
import { ClanManager } from "../shared/clan";

export default class Bot extends Client {
    readonly clan: ClanManager;

    constructor(options: ClientOptions, uid: string, passwordHash: string) {
        super(options);

        this.clan = new ClanManager(uid, passwordHash);

        this.on('ready', this.onReady.bind(this));
        this.on('interactionCreate', this.onInteractionCreate.bind(this));
        this.on('messageCreate', this.onMessageCreate.bind(this));
    }

    protected async onInteractionCreate(interaction: Interaction) {
        if(!interaction.isCommand()) return;

        const cmd = Commands.find(c => c.data.name === interaction.commandName);
        if(!cmd) {
            await interaction.reply({
                content: "Couldn't find command runner...",
                ephemeral: true
            });

            return;
        }

        await cmd.run(this, interaction);
    }

    protected async onReady() {
        if(!this.user || !this.application) {
            console.error("User or application aren't initialized!");
            return;
        }

        try {
            await this.user.setUsername(`Borb ${process.env.npm_package_version + (this.isDevelopment ? "D" : "")}`);
        } catch(error) {
            console.warn("Couldn't update bot username!");
        }

        if(this.isDevelopment) {
            this.user.setStatus('dnd');
        }

        Actions.forEach(action => {
            if(action.repeat) setInterval(() => action.run(this), action.timeout);
            else setTimeout(() => action.run(this), action.timeout);

            if(action.startOnInit) action.run(this);
        });
    }

    protected async onMessageCreate(msg: Message) {
        const PREFIX = "!";
        if(!msg.content.startsWith(PREFIX) || msg.author.bot) return;

        const cmd = msg.content.slice(PREFIX.length).trim().split(' ', 1)[0];
        const args = msg.content.slice(PREFIX.length + cmd.length).trim();

        if(cmd === 'send') {
            await msg.channel.sendTyping();

            const startMsg = `$$**${msg.member!.displayName}** would like to say:$$ \n`;
            const built = Emoji.makeEmojiMessage(msg.guild!, startMsg + args);

            if(built.length === 0) {
                await msg.delete();
                await msg.channel.send(startMsg + args);
            } else {
                await msg.delete();
                for(let i = 0; i < built.length; ++i) {
                    await msg.channel.send(`${built[i]}`);
                }
            }
        }
    }

    get isDevelopment(): boolean {
        return process.env.NODE_ENV != "production";
    }
}