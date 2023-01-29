import { Client, ClientOptions, GuildMember, Interaction, Message, PartialGuildMember } from "discord.js";
import { Actions } from "../actions";
import { Commands } from "../commands";
import Emoji from "../shared/emojis";
import GuildModel from "../models/guild";
import MemberModel from "../models/member";
import { ISchedule } from "../models/schedule";
import ScheduleModel from "../models/schedule";

export default class Bot extends Client {

    constructor(options: ClientOptions) {
        super(options);

        this.on('ready', this.onReady.bind(this));
        this.on('interactionCreate', this.onInteractionCreate.bind(this));
        this.on('messageCreate', this.onMessageCreate.bind(this));
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