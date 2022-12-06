import { NextFunction, Request, Response, Router } from "express";
import { getGuildIconURL, getUserIconURL, isAdmin } from "../shared/utils";
import GuildModel, { IGuild } from "../models/guild";
import { ClanManager } from "../shared/clan";
import DC from "../api/discord";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel, { ISchedule } from "../models/schedule";
import CH from "../api/clickerheroes";
import Bot from "../core/bot";
import { Guild, GuildMember } from "discord.js";

interface CustomRequest extends Request {
    guild?: any,
    member?: GuildMember
}

function isInGuild(req: CustomRequest, res: Response, next: NextFunction) {
    const guild_id = req.params.id;
    const token = req.headers.authorization;
    if(!token) {
        res.status(403).send({ message: "Path required authorization"});
        return;
    }

    const call = async () => {
        try {
            const data = await DC.getUserGuilds(token);
            const guild = data.find(o => o.id === guild_id);
            if(!guild) {
                res.status(404).send({ code: 0, message: "Not in the guild" });
                return;
            } else if(!isAdmin(guild.permissions)) {
                res.status(404).send({ code: 0, message: "Required admin permissions" });
                return;
            }
    
            req.guild = guild;
    
            next();
        } catch(error: any) {
            if(error.status == 429) {
                const retry_after = error.data.retry_after;
                console.log(`Rate limit hit, retrying after ${retry_after}`);

                setTimeout(call, retry_after * 1000);
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, message: error.data.message });
            }
        }
    };

    call();
}

const GuildRouter = Router();
GuildRouter.get('/:id', isInGuild, async (req: CustomRequest, res) => {
    const bot = req.app.get('bot') as Bot;

    const guild_id = req.params.id;
    try {
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        const botJoined = bot.guilds.cache.get(guild_id) !== undefined;
        
        res.send({
            id: req.guild?.id,
            name: req.guild?.name,
            icon: getGuildIconURL(req.guild),
            is_setup: db_guild != null,
            is_joined: botJoined
        });
    } catch(error: any) {
        res.status(parseInt(error.status));
        res.send({ code: error.data.code, message: error.data.message });
    }
});

GuildRouter.get('/:id/members', isInGuild, async (req, res) => {
    const guild_id = req.params.id;
    try {
        const db_guild = await GuildModel.findOne({ guild_id: guild_id });
        if(!db_guild) {
            res.status(404).send({ code: 0, message: "Didn't find guild" });
            return;
        }

        const clanInfo = await CH.getGuildInfo(db_guild.user_uid, db_guild.password_hash);
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

        const data = await DC.getGuildMembers(guild_id);
        const guildMembers = data.map((o: any) => {
            return {
                id: o.user.id,
                disc: o.user.discriminator,
                username: o.user.username,
                avatar: getUserIconURL(o.user, 48),
                nickname: o.nick
            };
        });

        res.send({
            clan: clanMembers,
            guild: guildMembers
        })
    } catch(error: any) {
        res.status(error.status);
        res.send({ code: error.data.code, msg: error.data.message });
    }
});

GuildRouter.get('/:id/connected', isInGuild, async (req, res) => {
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
});

GuildRouter.post('/:id/connected', isInGuild, async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.status(404).send({ code: 0, message: "Didn't find guild." });
        return;
    }

    const clanInfo = await CH.getGuildInfo(db_guild.user_uid, db_guild.password_hash);
    const members: any[] = await DC.getGuildMembers(guild_id);
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
});

GuildRouter.get('/:id/channels', isInGuild, async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.status(404);
        res.send({ code: 0, message: "Didn't find guild." });
        return;
    }

    const data: any[] = await DC.getGuildChannels(guild_id);
    const channels: any[] = [];
    for(const channel of data) {
        if(!channel.parent_id) continue;

        channels.push(channel);
    }

    res.send(channels);
});

GuildRouter.post('/:id/setup', isInGuild, async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(db_guild) {
        res.status(400).send({ code: 0, messsage: "Already setup."});
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
});

GuildRouter.post('/:id/unsetup', isInGuild, async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.status(404);
        res.send({ code: 0, message: "Didn't find guild." });
        return;
    }

    await db_guild.delete();
    res.send({ msg: "OK" });
});

GuildRouter.get('/:id/schedule', isInGuild, async (req, res) => {
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
    for(const entry of dbSchedule.map) {
        entries.push({ uid: entry.member.guild_uid, index: entry.index });
    }
    entries.sort((self, other) => {
        return self.index - other.index;
    });

    const MS_IN_DAY = 86400000;
    res.send({
        id: guild_id,
        start: dbSchedule.start_day,
        next_cycle: new Date(new Date(dbSchedule.start_day).getTime() + 10 * MS_IN_DAY),
        entries: entries
    });
});

GuildRouter.post('/:id/schedule', isInGuild, async (req, res) => {
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
            continue;
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
});

export default GuildRouter;