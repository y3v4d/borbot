import { Client, ClientOptions, Guild, GuildMember, Interaction, PartialGuildMember } from "discord.js";
import { Actions } from "./actions";
import { Commands } from "./commands";
import GuildModel from "../models/guild";
import Action from "./core/action";
import logger, { LoggerType } from "../shared/logger";
import GuildService from "../services/guild.service";
import ClanService from "../services/clan.service";

interface OngoingAction {
    action: Action,
    ticks: number
}

export default class BotClient {
    private _actions: OngoingAction[] = [];
    private _actionsInterval?: NodeJS.Timeout;

    private _isRunning: boolean = false;

    constructor(
        readonly client: Client,
        readonly guildService: GuildService,
        readonly clanService: ClanService
    ) {
        this._onGuildMemberRemove = this._onGuildMemberRemove.bind(this);
        this._onInteractionCreate = this._onInteractionCreate.bind(this);
    }

    async launch() {
        if(this._isRunning) {
            throw new Error("Can't launch, already running!");
        }

        if(!this.client.isReady()) {
            throw new Error("Can't launch, client is not ready!");
        }
        
        const { user, application } = this.client; 
        if(!user || !application) {
            throw new Error("User or application aren't initialized!");
        }

        try {
            if(!this.isDevelopment) {
                await user.setUsername(`Borbot 0.13`);
            } else {
                await user.setUsername(`borbot_dev`);
            }
            
            //await user.setAvatar(this.isDevelopment ? "https://i.imgur.com/1xMiyWX.png" : "https://i.imgur.com/eC0cR2X.png");
        } catch(error) {
            logger("Couldn't update bot username or avatar!", LoggerType.WARN);
        }

        if(this.isDevelopment) {
            user.setStatus('dnd');
        }

        this.client.on('interactionCreate', this._onInteractionCreate);
        this.client.on('guildMemberRemove', this._onGuildMemberRemove);

        this._startActions();
        this._isRunning = true;
    }

    stop() {
        this.client.off('interactionCreate', this._onInteractionCreate);
        this.client.off('guildMemberRemove', this._onGuildMemberRemove);

        this._stopActions();
        this._isRunning = false;
    }

    getCachedGuild(id: string) {
        const cached = this.client.guilds.cache.get(id);
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
        return process.env.PRODUCTION != 'true';
    }

    private async _onInteractionCreate(interaction: Interaction) {
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

    private async _onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
        try {
            await this.guildService.removeGuildConnectedMember({ guild_id: member.guild.id, guild_uid: member.id });
        } catch(error: any) {
            logger(`Error when removing connected member: `, error);
        }
    }

    private _startActions() {
        this._actions = Actions.map(o => ({
            action: o,
            ticks: o.startOnInit ? 0 : o.timeout
        }));

        let isExecuting = false;
        const execute = async () => {
            if(isExecuting) {
                logger("Can't execute, previous execution didn't finish!", LoggerType.WARN);
                return;
            }

            const list = this._actions.filter(o => {
                const shouldRun = --o.ticks <= 0;
                if(shouldRun) o.ticks = o.action.timeout;

                return shouldRun;
            });

            if(list.length === 0) {
                return;
            }
            
            GuildModel.find().then(async guilds => {
                for(const guild of guilds) {
                    (async () => {
                        for(const action of list) {
                            try {
                                await action.action.run(this, guild);
                            } catch(error: any) {
                                logger(`Error in action: ${JSON.stringify(error)}`, LoggerType.ERROR)
                            }
                        }

                        guild.save();
                    })();
                }
            }).catch(error => logger(`ActionRunner: Couldn't fetch guilds, error: ${error}`, LoggerType.ERROR));
        }

        execute();
        this._actionsInterval = setInterval(execute, 60000);
    }

    private _stopActions() {
        clearInterval(this._actionsInterval);
    }
}