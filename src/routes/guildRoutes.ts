import { Router } from "express";
import { getGuildIconURL } from "../shared/utils";
import GuildModel, { IGuild } from "../models/guild";
import { ClanManager } from "../shared/clan";
import DC from "../api/discord";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel from "../models/schedule";

const GuildRouter = Router();

GuildRouter.get('/:id', async (req, res) => {
    const guild_id = req.params.id;
    const guild_info = await DC.request(`guilds/${guild_id}`);
    if(guild_info.code != undefined) {
        res.send({ code: 301, msg: "Didn't find guild" });
        return;
    }

    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    res.send({
        code: 200,
        id: guild_info.id,
        name: guild_info.name,
        icon: getGuildIconURL(guild_info),
        is_setup: db_guild != null
    });
});

GuildRouter.post('/:id/setup', async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(db_guild) {
        res.send({ code: 301, msg: "Already setup."});
        return;
    }

    const uid = req.body.uid;
    const password_hash = req.body.pwd;
    
    const isValid = await ClanManager.test(uid, password_hash);
    if(!isValid) {
        res.send({ code: 301, msg: "Invalid data."});
        return;
    }

    const schema: IGuild = {
        guild_id: guild_id,
        user_uid: uid,
        password_hash: password_hash
    };

    await (new GuildModel(schema)).save();
    res.send({ code: 200 });
});

GuildRouter.post('/:id/unsetup', async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.send({ code: 301, msg: "Didn't find guild." });
        return;
    }

    await db_guild.delete();
    res.send({ code: 200 });
});

GuildRouter.get('/:id/schedule', async (req, res) => {
    const guild_id = (req.params as any).id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.send({ code: 301, msg: "Guild isn't setup" });
        return;
    }

    const dbMembers = await MemberModel.find({ guild_id: guild_id });
    if(!dbMembers) {
        res.send({ code: 301, msg: "Error retreiving members!" });
        return;
    }

    const dbSchedule = await ScheduleModel.findOne({ guild_id: guild_id })
        .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
    if(!dbSchedule) {
        res.send({ code: 301, msg: "Error retrieving schedule!" });
        return;
    }

    const users: any[] = await DC.request(`guilds/${guild_id}/members?limit=100`);
    const members: any[] = [];
    for(const entry of dbMembers) {
        const guildUser = users.find(o => o.user.id === entry.guild_uid);
        if(!guildUser) {
            res.send({ code: 301, msg: "Error retreiving guild user!" });
            return;
        }

        members.push({ 
            uid: guildUser.user.id,
            name: guildUser.nick || guildUser.user.username
        });
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
        code: 200,
        id: guild_id,
        start: dbSchedule.start_day,
        next_cycle: new Date(new Date(dbSchedule.start_day).getTime() + 10 * MS_IN_DAY),
        entries: entries,
        members: members
    });
});

GuildRouter.post('/:id/schedule', async (req, res) => {
    const guild_id = (req.params as any).id;

    const dbSchedule = await ScheduleModel.findOne({ guild_id: guild_id })
        .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
    if(!dbSchedule) {
        res.send({ code: 301, msg: "Couldn't retrieve schedule" });
        return;
    }

    for(let i = 0; i < dbSchedule.length; ++i) {
        const guild_uid = req.body[`${i + 1}`];
        if(!guild_uid) {
            console.warn("Didn't find index, skipping...");
            continue;
        }

        const entry = dbSchedule.map.find(o => o.index === i + 1);
        if(!entry) {
            console.warn(`Didn't find entry with index ${i + 1}`);
            continue;
        }

        if(entry.member.guild_uid === guild_uid) {
            console.log(`${i + 1} doesn't change, skipping...`);
            continue;
        }

        const dbMember = await MemberModel.findOne({ guild_uid: guild_uid });
        if(!dbMember) {
            res.send({ code: 301, msg: `Couldn't retrieve member with guild uid: ${guild_uid}` });
            continue;
        }

        entry.member = dbMember;
        await dbSchedule.save();
    }

    await dbSchedule.save();
    res.send({ code: 200 });
});

export default GuildRouter;