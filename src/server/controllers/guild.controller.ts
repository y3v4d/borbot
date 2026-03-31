import { NextFunction, Request, Response } from "express";
import Bot from "../../bot/client";
import { IsInGuildRequest } from "../middlewares/is_in_guild.middleware";
import { getUserIconURL } from "../../shared/utils";
import GuildService, { GuildConnectedMember, GuildScheduleUpdate, GuildScheduleUpdateEntry, GuildUpdateParams } from "../../services/guild.service";
import Code from "../../shared/code";
import ClanService from "../../services/clan.service";
import { ChannelType } from "discord.js";
import BotClient from "../../bot/client";

class GuildController {
    constructor(
        readonly bot: BotClient,
        readonly guildService: GuildService,
        readonly clanService: ClanService
    ) {}
    
    guild_get = async (req: IsInGuildRequest, res: Response) => {
        const userGuild = req.guild!;
        const dbGuild = await this.guildService.getGuild(userGuild.id);
        
        const is_setup = dbGuild !== null;
        const is_joined = !!this.bot.getCachedGuild(userGuild.id);
        
        res.send({
            id: userGuild.id,
            name: userGuild.name,
            icon: userGuild.icon,
            permissions: userGuild.permissions,
            isAdmin: userGuild.isAdmin,
            is_setup: is_setup,
            is_joined: is_joined,

            raid_announcement_channel: dbGuild?.raid_announcement_channel,
            raid_fight_role: dbGuild?.raid_fight_role,
            raid_claim_role: dbGuild?.raid_claim_role,

            remind_channel: dbGuild?.remind_channel,

            milestone_channel: dbGuild?.milestone_channel,
            chat_channel: dbGuild?.chat_channel
        });
    }

    guild_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        const params: GuildUpdateParams = {
            raid_announcement_channel: req.body.raid_announcement_channel,
            raid_fight_role: req.body.raid_fight_role,
            raid_claim_role: req.body.raid_claim_role,
            remind_channel: req.body.remind_channel,
            milestone_channel: req.body.milestone_channel,
            chat_channel: req.body.chat_channel
        };

        try {
            const cached = this.bot.getCachedGuild(GUILD_ID);
            if(!cached) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            if(params.raid_announcement_channel && !await this.bot.existsCachedGuildChannel(cached, params.raid_announcement_channel)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Invalid raid announcement channel"
                });
            }

            if(params.raid_fight_role && !await this.bot.existsCachedGuildRole(cached, params.raid_fight_role)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Invalid raid fight role"
                });
            }

            if(params.raid_claim_role && !await this.bot.existsCachedGuildRole(cached, params.raid_claim_role)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Invalid raid claim role"
                });
            }

            if(params.remind_channel && !await this.bot.existsCachedGuildChannel(cached, params.remind_channel)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Invalid remind channel"
                });
            }

            if(params.milestone_channel && !await this.bot.existsCachedGuildChannel(cached, params.milestone_channel)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Invalid milestone channel"
                });
            }

            if(params.chat_channel && !await this.bot.existsCachedGuildChannel(cached, params.chat_channel)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Invalid chat channel"
                });
            }

            const result = await this.guildService.updateGuild(GUILD_ID, params);
            if(!result) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            res.send({ code: Code.OK });
        } catch(error) {
            next(error);
        }
    }

    guild_post = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;
        const { uid: USER_ID, pwd: USER_PWD } = req.body;

        try {
            const cached = this.bot.getCachedGuild(GUILD_ID);
            if(!cached) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const isSetup = await this.guildService.isGuildSetup(GUILD_ID);
            if(isSetup) {
                next({ code: Code.GUILD_ALREADY_SETUP });
                return;
            }

            const clan = await this.clanService.getClanInformation(USER_ID, USER_PWD);
            if(!clan) {
                next({ code: Code.CLAN_INVALID_CREDENTIALS });
                return;
            }

            await this.guildService.addGuild(GUILD_ID, USER_ID, USER_PWD);

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const result = await this.guildService.removeGuild(GUILD_ID);
            if(!result) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_clan_members_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const guild = await this.guildService.getGuild(GUILD_ID);
            if(!guild) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            console.log(`Getting clan members for guild ${GUILD_ID}...`);

            const clan = await this.clanService.getClanInformation(guild.user_uid, guild.password_hash);
            if(!clan) {
                next({ code: Code.CLAN_INVALID_CREDENTIALS });
                return;
            }

            res.send(clan.members);
        } catch(error) {
            next(error);
        }
    }

    guild_members_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;
        
        try {
            const members = await this.bot.getCachedGuildMembers(GUILD_ID);
            if(!members) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const list: any[] = [];
            for(const [,member] of members) {
                list.push({
                    id: member.user.id,
                    discriminator: member.user.discriminator,
                    username: member.user.username,
                    avatar: getUserIconURL(member.user, 48),
                    nickname: member.nickname,
                    isBot: member.user.bot || false
                });
            }

            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    guild_channels_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const channels = await this.bot.getCachedGuildChannels(GUILD_ID);
            if(!channels) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const list: any[] = [];
            for(const [,channel] of channels) {
                if(!channel.parentId || channel.type !== ChannelType.GuildText) continue;

                list.push({
                    id: channel.id,
                    name: channel.name
                });
            }

            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    guild_roles_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const roles = await this.bot.getCachedGuildRoles(GUILD_ID);
            if(!roles) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const list: any[] = [];
            for(const [,role] of roles) {
                list.push({
                    id: role.id,
                    name: role.name
                });
            }

            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    guild_connected_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;
        
        try {
            const isSetup = await this.guildService.isGuildSetup(GUILD_ID);
            if(!isSetup) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            const members = await this.guildService.getGuildMembers(GUILD_ID);
            const list = members.map(o => ({
                guild_uid: o.guild_uid,
                clan_uid: o.clan_uid
            }));
    
            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    guild_connected_post = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        const data = req.body.data as GuildConnectedMember[] | undefined;
        if(!data) {
            res.status(400).send({
                code: Code.BAD_REQUEST,
                message: "List of connected members required."
            });

            return;
        }

        try {
            const guild = await this.guildService.getGuild(GUILD_ID);
            if(!guild) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            const members = await this.bot.getCachedGuildMembers(GUILD_ID);
            if(!members) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const clan = await this.clanService.getClanInformation(guild.user_uid, guild.password_hash);
            if(!clan) {
                next({ code: Code.CLAN_INVALID_CREDENTIALS });
                return;
            }

            const list: GuildConnectedMember[] = [];
            for(const entry of data) {
                const isInClan = clan.members.find(o => o.uid === entry.clan_uid) !== undefined;
                const isInGuild = entry.guild_uid === '' || members.find(o => o.id === entry.guild_uid) !== undefined;

                if(isInClan && isInGuild) {
                    list.push(entry);
                } else {
                    res.send(400).send({ 
                        code: Code.BAD_REQUEST, 
                        msg: `Invalid entry in list (clan uid: ${entry.clan_uid}, guild uid: ${entry.guild_uid})`
                    });

                    return;
                }
            }

            await this.guildService.updateGuildConnected(GUILD_ID, list);

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_schedule_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const schedule = await this.guildService.getGuildSchedule(GUILD_ID);
            if(!schedule) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            const data: any = {
                cycle_start: schedule.cycle_start,
                entries: [],

                channel: schedule.schedule_channel
            };
        
            for(let i = 1; i <= 10; ++i) {
                const entry = schedule.map.find(o => o.index == i);
                data.entries.push({ uid: entry?.member.guild_uid || '', index: i });
            }

            res.send(data);
        } catch(error: any) {
            next(error);
        }
    }

    guild_schedule_post = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        const data = req.body.list as { uid: string, index: number }[] | undefined;
        if(!data) {
            res.status(400).send({
                code: Code.BAD_REQUEST,
                message: "List of schedule entries required."
            });

            return;
        }

        const schedule: GuildScheduleUpdate = {
            cycle_start: new Date(req.body.cycle_start) || undefined,
            entries: [],

            channel: req.body.schedule_channel || undefined
        }
        
        try {
            const cached = await this.bot.getCachedGuild(GUILD_ID);
            if(!cached) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            if(schedule.channel) {
                const channel = await this.bot.getCachedGuildChannel(cached, schedule.channel);
                if(!channel) {
                    res.status(400).send({
                        code: Code.BAD_REQUEST,
                        message: "Invalid channel parameter"
                    });

                    return;
                }
            }

            const list: GuildScheduleUpdateEntry[] = [];
            for(const entry of data) {
                const member = await this.guildService.getGuildMemberByDiscordUID(GUILD_ID, entry.uid);
                const isIndexValid = entry.index >= 1 && entry.index <= 10;

                if(entry.uid === '' && isIndexValid) {
                    list.push({ index: entry.index });
                    continue;
                }

                if(member && isIndexValid) {
                    list.push({ index: entry.index, member: member });
                } else {
                    res.status(400).send({
                        code: Code.BAD_REQUEST,
                        msg: `Invalid entry in list (index: ${entry.index}, uid: ${entry.uid}`
                    });

                    return;
                }
            }
            schedule.entries = list;

            const result = await this.guildService.updateGuildSchedule(GUILD_ID, schedule);
            if(!result) {
                next({ code: Code.GUILD_NOT_SETUP });
                return;
            }

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }
}

export default GuildController;