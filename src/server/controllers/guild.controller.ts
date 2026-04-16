import { NextFunction, Request, Response } from "express";
import { IsInGuildRequest } from "../middlewares/is_in_guild.middleware";
import { validate_array, validate_date, validate_discord_channel, validate_discord_role, validate_str, validateParams } from "../../shared/utils";
import GuildService from "../../services/guild.service";
import Code from "../../shared/code";
import ClanService from "../../services/clan.service";
import { ChannelType } from "discord.js";
import BotClient from "../../bot/client";

type DeepKeyOf<T> = {
    [K in keyof T]: NonNullable<T[K]> extends { id: string } ? K : never
}[keyof T];

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
        const is_joined = !!(await this.bot.getCachedGuild(userGuild.id));
        
        const response: any = {
            id: userGuild.id,
            name: userGuild.name,
            icon: userGuild.icon,
            permissions: userGuild.permissions,
            isAdmin: userGuild.isAdmin,

            is_setup: is_setup,
            is_joined: is_joined,
        };

        if(dbGuild?.raid) {
            response.raid = await this._discordPopulateObject(userGuild.id, dbGuild.raid, ["channel"], ["fight_role", "claim_role"]);
        }

        if(dbGuild?.remind) {
            response.remind = await this._discordPopulateObject(userGuild.id, dbGuild.remind, ["channel"], []);
        }

        if(dbGuild?.chat) {
            response.chat = await this._discordPopulateObject(userGuild.id, dbGuild.chat, ["channel"], []);
        }

        if(dbGuild?.milestone) {
            response.milestone = await this._discordPopulateObject(userGuild.id, dbGuild.milestone, ["channel"], []);
        }

        if(dbGuild?.schedule) {
            response.schedule = await this._discordPopulateObject(userGuild.id, dbGuild.schedule, ["channel"], []);
        }

        res.send(response);
    }

    guild_post = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                uid: { type: validate_str },
                pwd: { type: validate_str }
            });
            
            const cached = await this.bot.getCachedGuild(GUILD_ID);
            if(!cached) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const isSetup = await this.guildService.isGuildSetup(GUILD_ID);
            if(isSetup) {
                next({ code: Code.GUILD_ALREADY_SETUP });
                return;
            }

            const clanInfo = await this.clanService.getClanInformation(params.uid, params.pwd);
            if(!clanInfo) {
                next({ code: Code.CLAN_INVALID_CREDENTIALS });
                return;
            }

            await this.guildService.addGuild(GUILD_ID, params.uid, params.pwd, clanInfo.name);
            for(const member of clanInfo.members) {
                await this.guildService.addGuildMember(GUILD_ID, member.uid, member);
            }

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            await this.guildService.removeGuild(GUILD_ID);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_raid_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                channel: { type: validate_discord_channel(this.bot, GUILD_ID), optional: true },
                fight_role: { type: validate_discord_role(this.bot, GUILD_ID), optional: true },
                claim_role: { type: validate_discord_role(this.bot, GUILD_ID), optional: true }
            });

            const hasRaid = await this.guildService.hasGuildRaid(GUILD_ID);
            if(!hasRaid && !params.channel) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Raid channel is required to set up raid"
                });
            }

            if(Object.keys(params).length === 0) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "At least one field (channel, fight_role, claim_role) is required to update raid"
                });
            }

            await this.guildService.setGuildRaid(GUILD_ID, params);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_raid_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            await this.guildService.unsetGuildRaid(GUILD_ID);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_remind_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                channel: { type: validate_discord_channel(this.bot, GUILD_ID) }
            });

            await this.guildService.setGuildRemind(GUILD_ID, params);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_remind_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            await this.guildService.unsetGuildRemind(GUILD_ID);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_chat_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                channel: { type: validate_discord_channel(this.bot, GUILD_ID) }
            });

            await this.guildService.setGuildChat(GUILD_ID, params);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_chat_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            await this.guildService.unsetGuildChat(GUILD_ID);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_milestone_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                channel: { type: validate_discord_channel(this.bot, GUILD_ID) }
            });
            
            await this.guildService.setGuildMilestone(GUILD_ID, params);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_milestone_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            await this.guildService.unsetGuildMilestone(GUILD_ID);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_schedule_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                channel: { type: validate_discord_channel(this.bot, GUILD_ID), optional: true },
                cycle_start: { type: validate_date, optional: true },
                list: { type: validate_array((value: any) => value ? validate_str(value) : null), optional: true }
            });

            const hasSchedule = await this.guildService.hasGuildSchedule(GUILD_ID);
            if(!hasSchedule && (!params.cycle_start || !params.list)) {
                return res.status(400).send({
                    code: Code.BAD_REQUEST,
                    message: "Schedule cycle start, and list are required to set up schedule"
                });
            }

            if(params.cycle_start) {
                params.cycle_start.setUTCHours(0, 0, 0, 0);
            }

            await this.guildService.setGuildSchedule(GUILD_ID, params);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_schedule_delete = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            await this.guildService.unsetGuildSchedule(GUILD_ID);
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }

    guild_members_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const members = await this.guildService.getGuildMembers(GUILD_ID);
            if(!members) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const list: any[] = [];
            for(const member of members) {
                list.push({
                    clan_uid: member.clan_uid,
                    nickname: member.nickname,

                    discord: member.discord
                });
            }

            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    guild_member_link_patch = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.body, {
                clan_uid: { type: validate_str },
                discord_user_id: { type: validate_str, nullable: true }
            });

            if(params.discord_user_id) {
                const discordMember = await this.bot.getCachedGuildMember(GUILD_ID, params.discord_user_id);
                if(!discordMember) {
                    res.status(400).send({
                        code: Code.BAD_REQUEST,
                        message: "Invalid Discord user ID"
                    });
                    return;
                }

                await this.guildService.linkDiscord(GUILD_ID, params.clan_uid, {
                    user_id: discordMember.user.id,
                    username: discordMember.user.username,
                    avatar: discordMember.user.avatar
                });

                res.send({ code: Code.OK });
            } else {
                await this.guildService.unlinkDiscord(GUILD_ID, params.clan_uid);
                res.send({ code: Code.OK });
            }
        } catch(error: any) {
            next(error);
        }
    }

    discord_members_list = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.query, {
                after: { type: validate_str, optional: true }
            });

            const members = await this.bot.listGuildMembers(GUILD_ID, params.after);
            if(members === null) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const list: any[] = [];
            for(const [,member] of members) {
                list.push({
                    user_id: member.user.id,
                    username: member.user.username,
                    avatar: member.user.avatar,
                });
            }

            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    discord_members_search = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const params = await validateParams(req.query, {
                q: { type: validate_str }
            });
            
            const members = await this.bot.searchGuildMembers(GUILD_ID, params.q);
            if(members === null) {
                next({ code: Code.GUILD_REQUIRES_BOT });
                return;
            }

            const list: any[] = [];
            for(const [,member] of members) {
                list.push({
                    user_id: member.user.id,
                    username: member.user.username,
                    avatar: member.user.avatar,
                });
            }

            res.send(list);
        } catch(error: any) {
            next(error);
        }
    }

    discord_channels_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const channels = await this.bot.fetchGuildChannels(GUILD_ID);
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

    discord_roles_get = async (req: Request, res: Response, next: NextFunction) => {
        const GUILD_ID = req.params.id;

        try {
            const roles = await this.bot.fetchGuildRoles(GUILD_ID);
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

    private async _discordPopulateObject<T extends object>(guild_id: string, obj: T, channelKeys: DeepKeyOf<T>[], roleKeys: DeepKeyOf<T>[]) {
        for(const key of channelKeys) {
            const deep = obj[key] as any;
            const channel_id = deep?.id;
            if(!channel_id) continue;

            const channel = await this.bot.getGuildChannel(guild_id, channel_id);
            if(channel) {
                deep.name = channel.name;
                deep.valid = true;
            } else {
                deep.valid = false;
            }
        }

        for(const key of roleKeys) {
            const deep = obj[key] as any;
            const role_id = deep?.id;
            if(!role_id) continue;

            const role = await this.bot.getGuildRole(guild_id, role_id);
            if(role) {
                deep.name = role.name;
                deep.color = role.colors.primaryColor.toString();
                deep.valid = true;
            } else {
                deep.valid = false;
            }
        }

        return obj;
    }
}

export default GuildController;