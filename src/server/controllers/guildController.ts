import { Response } from "express";
import ClickerHeroesAPI from "../../api/clickerheroes";
import DiscordAPI from "../../api/discord";
import Bot from "../../core/bot";
import { IsInGuildRequest } from "../middlewares/isInGuild";
import GuildModel, { IGuild } from "../../models/guild";
import MemberModel, { IMember } from "../../models/member";
import ScheduleModel from "../../models/schedule";
import { ClanManager } from "../../shared/clan";
import { getGuildIconURL, getUserIconURL, isAdmin } from "../../shared/utils";

const GuildController = {
    getGuildInformation: async function(req: IsInGuildRequest, res: Response) {
        const bot = req.app.get('bot') as Bot;
    
        const guild_id = req.params.id;
        try {
            const db_guild = await GuildModel.findOne({ guild_id: guild_id });
            const botJoined = bot.guilds.cache.get(guild_id) !== undefined;
            
            res.send({
                id: req.guild?.id,
                name: req.guild?.name,
                icon: getGuildIconURL(req.guild),
                permissions: req.guild?.permissions,
                isAdmin: isAdmin(req.guild?.permissions),
                is_setup: db_guild != null,
                is_joined: botJoined
            });
        } catch(error: any) {
            res.status(parseInt(error.status));
            res.send({ code: error.data.code, message: error.data.message });
        }
    },
    
    getGuildMembers: async function(req: IsInGuildRequest, res: Response) {
        const client = req.app.get('bot') as Bot;
        const guild_id = req.params.id;

        const guild = client.guilds.cache.get(guild_id);
        if(!guild) {
            res.status(404).send({ code: 0, message: `No bot in guild ${guild_id}` });
            return;
        }

        try {
            const db_guild = await GuildModel.findOne({ guild_id: guild_id });
            if(!db_guild) {
                res.status(404).send({ code: 0, message: "Didn't find guild" });
                return;
            }
    
            const clanInfo = await ClickerHeroesAPI.getGuildInfo(db_guild.user_uid, db_guild.password_hash);
            const clanMembers = Object.values(clanInfo.guildMembers).map(member => {
                return {
                    uid: member.uid,
                    highestZone: parseInt(member.highestZone),
                    nickname: member.nickname,
                    class: parseInt(member.chosenClass),
                    level: parseInt(member.classLevel),
    
                    lastRewardTimestamp: member.lastRewardTimestamp,
                    lastBonusRewardTimestamp: member.lastBonusRewardTimestamp
                }
            });
    
            const fetchedMembers = await guild.members.fetch();
            const guildMembers = fetchedMembers.map(o => {
                return {
                    id: o.user.id,
                    disc: o.user.discriminator,
                    username: o.user.username,
                    avatar: getUserIconURL(o.user, 48),
                    nickname: o.nickname,
                    isBot: o.user.bot || false
                }
            });
    
            res.send({
                clan: clanMembers,
                guild: guildMembers
            })
        } catch(error: any) {
            res.status(error.status);
            res.send({ code: error.data.code, msg: error.data.message });
        }
    },
    
    getConnectedUsers: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = req.params.id;
        try {
            const db_guild = await GuildModel.findOne({ guild_id: guild_id });
            if(!db_guild) {
                res.status(404);
                res.send({ code: 0, message: "Didn't find guild" });
                return;
            }
    
            const db_members = await MemberModel.find({ guild_id: guild_id });
            const items: any[] = [];
            
            for(const db_member of db_members) {
                items.push({
                    guild_uid: db_member.guild_uid, 
                    clan_uid: db_member.clan_uid
                });
            }
    
            res.send(items);
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
    
    setup: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = req.params.id;
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        if(db_guild) {
            res.status(400).send({ code: 0, messsage: "Already setup."});
            return;
        }
    
        const bot = req.app.get('bot') as Bot;
        if(!bot.guilds.cache.get(guild_id)) {
            res.status(400).send({ code: 0, message: 'Setup requires bot in the guild.' });
            return;
        }
    
        const uid = req.body.uid;
        const password = req.body.pwd;
    
        const isValid = await ClanManager.test(uid, password);
        if(!isValid) {
            res.status(400).send({ code: 0, message: "Invalid data."});
            return;
        }
    
        const schema: IGuild = {
            guild_id: guild_id,
            user_uid: uid,
            password_hash: password
        };
    
        await (new GuildModel(schema)).save();
    
        res.send({ msg: "OK" });
    },
    
    unsetup: async function(req: IsInGuildRequest, res: Response) {
        const guild_id = req.params.id;
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        if(!db_guild) {
            res.status(404);
            res.send({ code: 0, message: "Didn't find guild." });
            return;
        }
    
        await db_guild.delete();
        res.send({ msg: "OK" });
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