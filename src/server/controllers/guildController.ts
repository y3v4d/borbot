import { NextFunction, Response } from "express";
import ClickerHeroesAPI from "../../api/clickerheroes";
import DiscordAPI from "../../api/discord";
import Bot from "../../core/bot";
import { IsInGuildRequest } from "../middlewares/isInGuild";
import GuildModel, { IGuild } from "../../models/guild";
import MemberModel, { IMember } from "../../models/member";
import ScheduleModel from "../../models/schedule";
import { getGuildIconURL } from "../../shared/utils";
import GuildService from "../../services/guildService";
import ClanService from "../../services/clanService";
import Code from "../../shared/code";

const GuildController = {
    getGuildInformation: async function(req: IsInGuildRequest, res: Response) {
        const GuildService = req.app.get('guildService') as GuildService;
        
        const userGuild = req.guild!;
        const guild_id = req.params.id;
        const bot = req.app.get('bot') as Bot;
        
        try {
            const is_setup = await GuildService.isGuildSetup(guild_id);
            const is_joined = bot.guilds.cache.get(guild_id) !== undefined;
            
            res.send({
                id: userGuild.id,
                name: userGuild.name,
                icon: getGuildIconURL(userGuild),
                permissions: userGuild.permissions,
                isAdmin: userGuild.isAdmin,
                is_setup: is_setup,
                is_joined: is_joined
            });
        } catch(error: any) {
            res.status(parseInt(error.status));
            res.send({ code: error.data.code, message: error.data.message });
        }
    },
    
    getGuildMembers: async function(req: IsInGuildRequest, res: Response, next: NextFunction) {
        const GUILD_ID = req.params.id;

        const ClanService = req.app.get('clanService') as ClanService;
        const GuildService = req.app.get('guildService') as GuildService;
        
        try {
            const dbGuild = await GuildModel.findOne({ guild_id: GUILD_ID });
            if(!dbGuild) {
                res.status(404).send({ code: Code.GUILD_NOT_SETUP, message: "Guild not setup" });
                return;
            }

            const clanMembers = await ClanService.getClanMembers(dbGuild.user_uid, dbGuild.password_hash);
            const guildMembers = await GuildService.getGuildMembers(GUILD_ID);

            res.send({
                clan: clanMembers,
                guild: guildMembers
            });
        } catch(error: any) {
            if(error.code === Code.GUILD_REQUIRES_BOT) {
                res.status(404).send(error);
            } else if(error.code === Code.CLAN_INVALID_CREDENTIALS) {
                res.status(404).send(error);
            } else {
                next(error);
            }
        }
    },
    
    getConnectedUsers: async function(req: IsInGuildRequest, res: Response) {
        const GUILD_ID = req.params.id;
        const GuildService = req.app.get('guildService') as GuildService;
        
        try {
            const connected = await GuildService.getGuildConnectedMembers(GUILD_ID);
    
            res.send(connected);
        } catch(error: any) {
            res.status(error.status);
            res.send({ code: error.data.code, message: error.data.message });
        }
    },
    
    postConnectedUsers: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = req.params.id;
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        if(!db_guild) {
            res.status(404).send({ code: 0, message: "Didn't find guild." });
            return;
        }
    
        const clanInfo = await ClickerHeroesAPI.getGuildInfo(db_guild.user_uid, db_guild.password_hash);
        const members: any[] = await DiscordAPI.getGuildMembers(guild_id);
        const clanMembers = Object.values(clanInfo.guildMembers);
    
        const data: { clan_uid: string, guild_uid: string }[] = req.body.data;
        for(const connector of data) {
            if(clanMembers.find(o => o.uid === connector.clan_uid)) {
                if(connector.guild_uid == "none") {
                    await MemberModel.findOneAndDelete({ clan_uid: connector.clan_uid, guild_id: guild_id });
                } else if(members.find(o => o.user.id === connector.guild_uid)) {
                    await MemberModel.findOneAndUpdate(
                        { clan_uid: connector.clan_uid, guild_id: guild_id }, 
                        { guild_uid: connector.guild_uid },
                        { upsert: true }
                    );
                } else {
                    console.warn(`Invalid information (guild_uid: ${connector.guild_uid})`);
                }
            } else {
                console.warn(`Invalid information (clan_uid: ${connector.clan_uid})`);
            }
        }
    
        res.send({ msg: 'OK' });
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
        const { uid: USER_ID, pwd: USER_PWD } = req.body;

        const GuildService = req.app.get('guildService') as GuildService;

        try {
            await GuildService.createSetupGuild(GUILD_ID, USER_ID, USER_PWD);

            res.send({ msg: "OK" });
        } catch(error: any) {
            const { code } = error;
            if(code === Code.GUILD_REQUIRES_BOT || Code.GUILD_ALREADY_SETUP || Code.CLAN_INVALID_CREDENTIALS) {
                res.status(404).send(error);
                return;
            }
            
            next(error);
        }
    },
    
    unsetup: async function(req: IsInGuildRequest, res: Response) {
        const GUILD_ID = req.params.id;

        const { removeSetupGuild } = req.app.get('guildService') as GuildService;

        try {
            await removeSetupGuild(GUILD_ID);
            res.send({ msg: "OK" });
        } catch(error) {
            res.status(400).send(error);
        }
    },
    
    getSchedule: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = req.params.id;
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        if(!db_guild) {
            res.status(400);
            res.send({ code: 0, message: "Guild isn't setup" });
            return;
        }
    
        const dbSchedule = await ScheduleModel.findOne({ _id: db_guild.schedule })
            .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
        if(!dbSchedule) {
            res.status(400);
            res.send({ code: 0, message: "Error retrieving schedule!" });
            return;
        }
    
        const entries: any[] = [];
        for(let i = 1; i <= 10; ++i) {
            const entry = dbSchedule.map.find(o => o.index == i);
            entries.push({ uid: entry ? entry.member.guild_uid : '', index: i });
        }
    
        const MS_IN_DAY = 86400000;
        res.send({
            id: guild_id,
            start: dbSchedule.start_day,
            next_cycle: new Date(new Date(dbSchedule.start_day).getTime() + 10 * MS_IN_DAY),
            entries: entries
        });
    },
    
    postSchedule: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = (req.params as any).id;
    
        const dbSchedule = await ScheduleModel.findOne({ guild_id: guild_id })
            .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
        if(!dbSchedule) {
            res.status(400);
            res.send({ code: 0, message: "Couldn't retrieve schedule" });
            return;
        }
    
        for(let i = 0; i < dbSchedule.length; ++i) {
            const guild_uid = req.body.data.find((o: any) => o.index == i + 1).uid;
            if(!guild_uid) {
                console.warn("Didn't find index, skipping...");
                continue;
            }
    
            const dbMember = await MemberModel.findOne({ guild_uid: guild_uid });
            if(!dbMember) {
                res.send({ code: 301, msg: `Couldn't retrieve member with guild uid: ${guild_uid}` });
                return;
            }
    
            const entry = dbSchedule.map.find(o => o.index === i + 1);
            if(!entry) {
                console.warn(`Didn't find entry with index ${i + 1}. Creating...`);
                dbSchedule.map.push({ member: dbMember, index: i + 1 });
                continue;
            }
    
            if(entry.member.guild_uid === guild_uid) {
                console.log(`${i + 1} doesn't change, skipping...`);
                continue;
            }
    
            entry.member = dbMember;
        }
    
        await dbSchedule.save();
        res.send({ msg: "OK" });
    }
};

export default GuildController;