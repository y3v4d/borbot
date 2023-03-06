import { NextFunction, Response } from "express";
import DiscordAPI from "../../api/discord";
import Bot from "../../core/bot";
import { IsInGuildRequest } from "../middlewares/isInGuild.middleware";
import GuildModel from "../../models/guild";
import { getGuildIconURL } from "../../shared/utils";
import { GuildConnectedMember, GuildScheduleEntry } from "../../services/guildService";
import Code from "../../shared/code";

const GuildController = {
    getGuildInformation: async function(req: IsInGuildRequest, res: Response) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        const userGuild = req.guild!;
        
        const is_setup = await bot.guildService.isGuildSetup(GUILD_ID);
        const is_joined = bot.guilds.cache.get(GUILD_ID) !== undefined;
        
        res.send({
            id: userGuild.id,
            name: userGuild.name,
            icon: getGuildIconURL(userGuild),
            permissions: userGuild.permissions,
            isAdmin: userGuild.isAdmin,
            is_setup: is_setup,
            is_joined: is_joined
        });
    },
    
    getGuildMembers: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;
        
        try {
            const dbGuild = await bot.guildService.getGuildById(GUILD_ID);

            const clan = await bot.clanService.getClanInformation(dbGuild.user_uid, dbGuild.password_hash);
            const guildMembers = await bot.guildService.getGuildMembers(GUILD_ID);

            res.send({
                clan: clan.members,
                guild: guildMembers
            });
        } catch(error: any) {
            next(error);
        }
    },
    
    getConnectedUsers: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;
        
        try {
            const connected = await bot.guildService.getGuildConnectedMembers(GUILD_ID);
    
            res.send(connected);
        } catch(error: any) {
            next(error);
        }
    },
    
    postConnectedUsers: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        const list = req.body.data as GuildConnectedMember[] | undefined;
        if(!list) {
            res.status(400).send({
                code: Code.BAD_REQUEST,
                message: "List of connected members required."
            });

            return;
        }

        try {
            await bot.guildService.updateGuildConnectedMembers(GUILD_ID, list);
        
            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    },
    
    getGuildChannels: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        try {
            const channels = await bot.guildService.getGuildChannels(GUILD_ID);

            res.send(channels);
        } catch(error: any) {
            next(error);
        }
    },

    getGuildRoles: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        try {
            const roles = await bot.guildService.getGuildRoles(GUILD_ID);

            res.send(roles);
        } catch(error: any) {
            next(error);
        }
    },
    
    setup: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        const { uid: USER_ID, pwd: USER_PWD } = req.body;

        try {
            await bot.guildService.createSetupGuild(GUILD_ID, USER_ID, USER_PWD);

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    },
    
    unsetup: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        try {
            await bot.guildService.removeSetupGuild(GUILD_ID);

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    },

    getRaid: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        try {
            const raid = await bot.guildService.getGuildRaid(GUILD_ID);

            res.send(raid);
        } catch(error) {
            next(error);
        }
    },

    updateRaid: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        const announcement_channel = req.body.announcement_channel || "";
        const fight_role = req.body.fight_role || "";
        const claim_role = req.body.claim_role || "";

        try {
            await bot.guildService.updateGuildRaid(GUILD_ID, announcement_channel, fight_role, claim_role);

            res.send({ code: 200 });
        } catch(error) {
            next(error);
        }
    },
    
    getSchedule: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        try {
            const schedule = await bot.guildService.getGuildSchedule(GUILD_ID);

            res.send(schedule);
        } catch(error: any) {
            next(error);
        }
    },
    
    postSchedule: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;
        const bot = req.app.get('bot') as Bot;

        const schedule_channel = req.body.schedule_channel || "";
        const list = req.body.list as GuildScheduleEntry[] | undefined;
        if(!list) {
            res.status(400).send({
                code: Code.BAD_REQUEST,
                message: "List of schedule entries required."
            });

            return;
        }

        const cycle_start = new Date(req.body.cycle_start) || undefined;
        
        try {
            await bot.guildService.updateGuildSchedule(GUILD_ID, list, schedule_channel, cycle_start);

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }
};

export default GuildController;