import { Client, ClientOptions, Guild, GuildMember, Interaction, PartialGuildMember } from "discord.js";
import { Actions } from "./actions";
import { Commands } from "./commands";
import GuildModel from "../models/guild";
import Action from "./core/action";
import logger, { LoggerType } from "../shared/logger";
import GuildService from "../services/guildService";

interface OngoingAction {
    action: Action,
    ticks: number
}

export default class Bot extends Client {
    private _actions: OngoingAction[] = [];

    constructor(options: ClientOptions) {
        super(options);

        this.on('ready', this.onReady.bind(this));
        this.on('interactionCreate', this.onInteractionCreate.bind(this));
        this.on('guildMemberRemove', this.onGuildMemberRemove.bind(this));
    }

    protected async onReady() {
        if(!this.user || !this.application) {
            console.error("User or application aren't initialized!");
            return;
        }

        try {
            if(!this.isDevelopment) {
                await this.user.setUsername(`Borbot ${process.env.npm_package_version}`);
            } else {
                await this.user.setUsername(`Borbot In Development`);
            }
            
            await this.user.setAvatar(this.isDevelopment ? "https://i.imgur.com/1xMiyWX.png" : "https://i.imgur.com/eC0cR2X.png");
        } catch(error) {
            console.warn("Couldn't update bot username or avatar!");
        }

        if(this.isDevelopment) {
            this.user.setStatus('dnd');
        }

        this.intializeActions(Actions);
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

    protected async onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
        try {
            await GuildService.removeGuildConnectedMember({ guild_id: member.guild.id, guild_uid: member.id });
        } catch(error: any) {
            logger(`Error when removing connected member: `, error);
        }
    }

    private intializeActions(actions: Action[]) {
        this._actions = actions.map(o => ({
            action: o,
            ticks: o.startOnInit ? 0 : o.timeout
        }));

        const execute = () => {
            const list = this._actions.filter(o => {
                const shouldRun = --o.ticks <= 0;
                if(shouldRun) o.ticks = o.action.timeout;

                return shouldRun;
            });
            if(list.length === 0) return;
            
            GuildModel.find().then(async guilds => {
                for(const guild of guilds) {
                    (async () => {
                        for(const action of list) {
                            try {
                                await action.action.run(this, guild);
                            } catch(error) {
                                logger(`Error in action: ${error}`, LoggerType.ERROR)
                            }
                        }

                        guild.save();
                    })();
                }
            }).catch(error => logger(`ActionRunner: Couldn't fetch guilds, error: ${error}`, LoggerType.ERROR));
        }

        execute();
        setInterval(execute, 60000);
    }

    getCachedGuild(id: string) {
        const cached = this.guilds.cache.get(id);
        if(!cached) return null;

        return cached;
    }

    async getCachedGuildMembers(id: string, fetch = true) {
        const guild = this.getCachedGuild(id);
        if(!guild) return null;

        if(fetch) await guild.members.fetch();
        return guild.members.cache;
    }

    async getCachedGuildMember(guild_id: string, member_id: string, fetch = true) {
        const guild = this.getCachedGuild(guild_id);
        if(!guild) return null;

        if(fetch) await guild.members.fetch();
        return guild.members.cache.get(member_id);
    }

    async getCachedGuildChannels(id: string, fetch = false) {
        const guild = this.getCachedGuild(id);
        if(!guild) return null;

        if(fetch) await guild.channels.fetch();
        return guild.channels.cache;
    }

    async getCachedGuildChannel(guild: Guild, channel_id: string, fetch = false) {
        if(fetch) await guild.channels.fetch();
        return guild.channels.cache.get(channel_id);
    }

    async existsCachedGuildChannel(guild: Guild, channel_id: string, fetch = false) {
        if(fetch) await guild.channels.fetch();
        return guild.channels.cache.has(channel_id);
    }

    async getCachedGuildRoles(id: string, fetch = false) {
        const guild = this.getCachedGuild(id);
        if(!guild) return null;

        if(fetch) await guild.roles.fetch();
        return guild.roles.cache;
    }

    async existsCachedGuildRole(guild: Guild, role_id: string, fetch = false) {
        if(fetch) await guild.roles.fetch();
        return guild.roles.cache.has(role_id);
    }

    get isDevelopment(): boolean {
        console.log(`node env equal to `, process.env.NODE_ENV);
        return process.env.NODE_ENV != "production";
    }
}