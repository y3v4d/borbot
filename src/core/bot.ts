import { Client, ClientOptions, GuildMember, Interaction, Message, PartialGuildMember } from "discord.js";
import { Actions } from "../actions";
import { Commands } from "../commands";
import GuildModel from "../models/guild";
import MemberModel from "../models/member";
import { ISchedule } from "../models/schedule";
import ScheduleModel from "../models/schedule";
import GuildService from "../services/guildService";
import ClanService from "../services/clanService";
import Action from "./action";
import logger from "../shared/logger";

interface OngoingAction {
    action: Action,
    ticks: number
}

export default class Bot extends Client {
    private _guildService: GuildService;
    private _clanService: ClanService;

    private _actions: OngoingAction[] = [];

    constructor(options: ClientOptions) {
        super(options);

        this._guildService = new GuildService(this);
        this._clanService = new ClanService();

        this.on('ready', this.onReady.bind(this));
        this.on('interactionCreate', this.onInteractionCreate.bind(this));
        this.on('guildMemberRemove', this.onGuildMemberRemove.bind(this));
    }

    protected async onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
        const dbGuild = await GuildModel.findOne({ guild_id: member.guild.id });
        if(!dbGuild) {
            console.warn("Couldn't find guild with id " + member.guild.id);
            return;
        }

        const dbMember = await MemberModel.findOne({ guild_id: dbGuild.guild_id, guild_uid: member.id });
        if(!dbMember) {
            console.warn(`Couldn't find guild member with id ${member.id}`);
            return;
        }

        const dbSchedule = (await dbGuild.populate<{ schedule: ISchedule }>('schedule')).schedule;
        if(!dbSchedule) {
            console.warn("Couldn't find schedule in guild " + dbGuild.guild_id);
        } else {
            const scheduleIndex = dbSchedule.map.findIndex(o => o.member.equals(dbMember._id));
            if(scheduleIndex === -1) return;

            dbSchedule.map.splice(scheduleIndex, 1);
            await ScheduleModel.updateOne(dbSchedule);

            console.log(`Removed ${dbMember._id} user from schedule.`);
        }
        

        await dbMember.delete();
        console.log(`Removed member with guild id ${member.id} from the database.`);
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

    get guildService() {
        return this._guildService;
    }

    get clanService() {
        return this._clanService;
    }

    get isDevelopment(): boolean {
        return process.env.NODE_ENV != "production";
    }
}