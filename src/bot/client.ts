import { Client, Guild, GuildMember, Interaction, PartialGuildMember } from "discord.js";
import { Actions } from "./actions";
import { Commands } from "./commands";
import Action from "./core/action";
import logger, { LoggerType } from "../shared/logger";
import GuildService from "../services/guild.service";
import ClanService from "../services/clan.service";
import meassure from "../shared/meassure.decorator";
import { singleFlight } from "../shared/single-flight.decorator";

interface OngoingAction {
    action: Action,
    ticks: number
}

export default class BotClient {
    private _actions: OngoingAction[] = [];
    private _actionsInterval?: NodeJS.Timeout;

    private _isRunning: boolean = false;

    private _lastMembersFetch: number = 0;
    private _lastChannelsFetch: number = 0;
    private _lastRolesFetch: number = 0;

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

    @meassure
    @singleFlight((guild_id: string, after?: string) => `listGuildMembers:${guild_id}/${after ?? 'start'}`)
    async listGuildMembers(guild_id: string, after?: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        return guild.members.list({ limit: 20, after }).catch(() => null);
    }

    @meassure
    @singleFlight((guild_id: string, query: string) => `searchGuildMembers:${guild_id}/${query}`)
    async searchGuildMembers(guild_id: string, query: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        return guild.members.search({ query, limit: 10 }).catch(() => null);
    }

    @meassure
    @singleFlight((guild_id: string, limit: number) => `fetchGuildMembers:${guild_id}/${limit}`)
    async fetchGuildMembers(guild_id: string, limit: number) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        if(Date.now() - this._lastMembersFetch < 5 * 60 * 1000) {
            return guild.members.cache;
        }

        this._lastMembersFetch = Date.now();
        return guild.members.fetch({ limit }).catch(() => null);
    }

    @meassure
    @singleFlight((guild_id: string) => `fetchGuildChannels:${guild_id}`)
    async fetchGuildChannels(guild_id: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        if(Date.now() - this._lastChannelsFetch < 30 * 60 * 1000) {
            return guild.channels.cache;
        }
        
        try {
            await guild.channels.fetch();
            this._lastChannelsFetch = Date.now();

            return guild.channels.cache;
        } catch {
            return null;
        }
    }

    @meassure
    @singleFlight((guild_id: string) => `fetchGuildRoles:${guild_id}`)
    async fetchGuildRoles(guild_id: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        if(Date.now() - this._lastRolesFetch < 30 * 60 * 1000) {
            return guild.roles.cache;
        }

        this._lastRolesFetch = Date.now();
        return guild.roles.fetch().catch(() => null);
    }

    @meassure
    async getCachedGuild(id: string) {
        const cached = this.client.guilds.cache.get(id);
        if(cached) return cached;

        return this.client.guilds.fetch(id).catch(() => null);
    }

    @meassure
    async getCachedGuildMember(guild_id: string, member_id: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        const cached = guild.members.cache.get(member_id);
        if(cached) return cached;

        return guild.members.fetch(member_id).catch(() => null);
    }

    @meassure
    async getGuildChannel(guild_id: string, channel_id: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        const cached = guild.channels.cache.get(channel_id);
        if(cached) return cached;

        return guild.channels.fetch(channel_id).catch(() => null);
    }

    @meassure
    async getGuildRole(guild_id: string, role_id: string) {
        const guild = await this.getCachedGuild(guild_id);
        if(!guild) return null;

        const cached = guild.roles.cache.get(role_id);
        if(cached) return cached;

        return guild.roles.fetch(role_id).catch(() => null);
    }

    @meassure
    async getCachedGuildChannel(guild: Guild, channel_id: string) {
        const cached = guild.channels.cache.get(channel_id);
        if(cached) return cached;

        return guild.channels.fetch(channel_id).catch(() => null);
    }

    @meassure
    async existsCachedGuildChannel(guild: Guild, channel_id: string) {
        const cached = guild.channels.cache.get(channel_id);
        if(cached) return true;

        if(this._lastChannelsFetch && Date.now() - this._lastChannelsFetch < 5 * 60 * 1000) {
            return false;
        }

        const fetched = await guild.channels.fetch(channel_id).catch(() => null);
        return !!fetched;
    }

    @meassure
    async existsCachedGuildRole(guild: Guild, role_id: string) {
        const cached = guild.roles.cache.get(role_id);
        if(cached) return true;

        if(this._lastRolesFetch && Date.now() - this._lastRolesFetch < 5 * 60 * 1000) {
            return false;
        }

        const fetched = await guild.roles.fetch(role_id).catch(() => null);
        return !!fetched;
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

        logger(`Running command ${cmd.data.name} for guild ${interaction.guildId} and user ${interaction.user.tag}`);

        await cmd.run(this, interaction);
    }

    private async _onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
        logger(`Member ${member.user.tag} left guild ${member.guild.id}`);
        
        try {
            await this.guildService.removeAllDiscordLink(member.id);
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

            const operations: Promise<void>[] = [];
            const allGuildIDs = await this.guildService.getAllGuildIDs();
            for(const guild_id of allGuildIDs) {
                const guild = await this.guildService.getGuild(guild_id);
                if(!guild) {
                    logger(`#startActions Couldn't find guild with id ${guild_id}!`, LoggerType.WARN);
                    continue;
                }

                operations.push(
                    (async () => {
                        let successful = 0;
                        for(const action of list) {
                            try {
                                const now = Date.now();
                                await action.action.run(this, guild);
                                const delta = Date.now() - now;
                                
                                logger(`Action ${action.action.name} in guild ${guild_id} executed successfully in ${delta}ms`);
                                successful++;
                            } catch(error: any) {
                                logger(`Error in action ${action.action.name} for guild ${guild_id}: ${error.message}`, LoggerType.ERROR);
                            }
                        }
                        
                        logger(`Completed all actions for guild ${guild_id} with ${successful}/${list.length} successes!`);
                    })()
                );
            }

            await Promise.allSettled(operations);
        }

        execute();
        this._actionsInterval = setInterval(execute, 30_000);
    }

    private _stopActions() {
        clearInterval(this._actionsInterval);
    }
}