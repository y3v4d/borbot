import { NextFunction, Response } from "express";
import DiscordAPI from "../../api/discord";
import Bot from "../../core/bot";
import { IsInGuildRequest } from "../middlewares/isInGuild";
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

            const clanMembers = await bot.clanService.getClanMembers(dbGuild.user_uid, dbGuild.password_hash);
            const guildMembers = await bot.guildService.getGuildMembers(GUILD_ID);

            res.send({
                clan: clanMembers,
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
    
    getGuildChannels: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = req.params.id;
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        if(!db_guild) {
            res.status(404);
            res.send({ code: 0, message: "Didn't find guild." });
            return;
        }
    
        const data: any[] = await DiscordAPI.getGuildChannels(guild_id);
        const channels: any[] = [];
        for(const channel of data) {
            if(!channel.parent_id) continue;
    
            channels.push(channel);
        }
    
        res.send(channels);
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

        const list = req.body.data as GuildScheduleEntry[] | undefined;
        if(!list) {
            res.status(400).send({
                code: Code.BAD_REQUEST,
                message: "List of schedule entries required."
            });

            return;
        }

        try {
            await bot.guildService.updateGuildSchedule(GUILD_ID, list);

            res.send({ code: Code.OK });
        } catch(error: any) {
            next(error);
        }
    }
};

export default GuildController;