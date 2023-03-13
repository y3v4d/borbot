import { Client, ClientOptions, Guild, GuildMember, Interaction, Message, PartialGuildMember } from "discord.js";
import { Actions } from "../actions";
import { Commands } from "../commands";
import GuildModel from "../models/guild";
import MemberModel from "../models/member";
import { ISchedule } from "../models/schedule";
import ScheduleModel from "../models/schedule";
import Action from "./action";
import logger from "../shared/logger";
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

    protected async onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
        try {
            const connected = await GuildService.getGuildConnectedMember(member.guild.id, member.id);
            if(!connected) return;

            const result = await GuildService.removeGuildConnectedMember(connected);
            if(!result) {
                logger(`Didn't remove member ${member.id} from guild ${member.guild.id} schedule.`);
                return;
            }
        } catch(error: any) {
            logger(`Error when removing connected member: `, error);
        }
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

    protected intializeActions(actions: Action[]) {
        this._actions = actions.map(o => ({
            action: o,
            ticks: o.startOnInit ? 0 : o.timeout
        }));

        const execute = () => {
            const list = this._actions.filter(o => {
                return --o.ticks <= 0;
            });
            if(list.length === 0) return;
            
            GuildModel.find().then(guilds => {
                for(const guild of guilds) {
                    list.forEach(o => {
                        o.action.run(this, guild);
                        o.ticks = o.action.timeout;
                    });
                }
            }).catch(error => logger(`ActionRunner: Couldn't fetch guilds, error: `, error));
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
        return process.env.NODE_ENV != "production";
    }
}