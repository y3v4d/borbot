import { Router } from "express";
import { getGuildIconURL, getUserIconURL } from "../shared/utils";
import GuildModel, { IGuild } from "../models/guild";
import { ClanManager } from "../shared/clan";
import DC from "../api/discord";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel from "../models/schedule";
import CH from "../api/clickerheroes";
import axios from "axios";

const API_ENDPOINT = "https://discord.com/api/v10";

const GuildRouter = Router();

GuildRouter.get('/:id', async (req, res) => {
    const guild_id = req.params.id;
    const token = req.session.token as string;

    const tryThis = async () => {
        try {
            const data = await DC.getUserGuilds(token);
    
            const guild_info = data.find((o: any) => o.id === guild_id);
            if(!guild_info) {
                res.status(404);
                res.send({ code: 0, message: "Couldn't find the guild" });
                return;
            }

            const botGuildResponse = await axios.get(`${API_ENDPOINT}/users/@me/guilds`, {
                headers: {
                    'Authorization': `Bot ${process.env.TOKEN}`
                }
            });
    
            const db_guild = await GuildModel.findOne({ guild_id: guild_id });
            res.send({
                id: guild_info.id,
                name: guild_info.name,
                icon: getGuildIconURL(guild_info),
                is_setup: db_guild != null,
                is_joined: botGuildResponse.data.findIndex((o: any) => o.id === guild_id) != -1
            });
        } catch(error: any) {
            if(error.status == 429) {
                setTimeout(async () => await tryThis(), 1000); 
            } else {
                res.status(parseInt(error.status));
                res.send({ code: error.data.code, message: error.data.message });
            }
            
        }
    }

    await tryThis();
});

GuildRouter.post('/:id/setup', async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(db_guild) {
        res.status(400);
        res.send({ code: 0, messsage: "Already setup."});
        return;
    }

    const uid = req.body.uid;
    const password_hash = req.body.pwd;
    
    const isValid = await ClanManager.test(uid, password_hash);
    if(!isValid) {
        res.status(400);
        res.send({ code: 0, message: "Invalid data."});
        return;
    }

    const schema: IGuild = {
        guild_id: guild_id,
        user_uid: uid,
        password_hash: password_hash
    };

    await (new GuildModel(schema)).save();
    res.send();
});

GuildRouter.post('/:id/unsetup', async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.status(404);
        res.send({ code: 0, message: "Didn't find guild." });
        return;
    }

    await db_guild.delete();
    res.send();
});

GuildRouter.get('/:id/schedule', async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.status(400);
        res.send({ code: 0, message: "Guild isn't setup" });
        return;
    }

    const dbSchedule = await ScheduleModel.findOne({ guild_id: guild_id })
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

GuildRouter.post('/:id/schedule', async (req, res) => {
    const guild_id = (req.params as any).id;

    const dbSchedule = await ScheduleModel.findOne({ guild_id: guild_id })
        .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
    if(!dbSchedule) {
        res.status(400);
        res.send({ code: 0, message: "Couldn't retrieve schedule" });
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
            res.status(400);
            res.send({ code: 0, msg: `Couldn't retrieve member with guild uid: ${guild_uid}` });
            continue;
        }

        entry.member = dbMember;
        await dbSchedule.save();
    }

    await dbSchedule.save();
    res.send();
});

GuildRouter.get('/:id/clanMembers', async (req, res) => {
    const token = req.session.token;
    const guild_id = req.params.id;

    const tryThis = async () => {
        try {
            await axios.get(`${API_ENDPOINT}/users/@me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const db_guild = await GuildModel.findOne({ guild_id: guild_id });
            if(!db_guild) {
                res.status(404);
                res.send({ code: 0, message: "Didn't gind guild" });
                return;
            }

            const data = await CH.getGuildInfo(db_guild.user_uid, db_guild.password_hash);
            const members = Object.values(data.guildMembers).map(member => {
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

            res.send(members);
        } catch(error: any) {
            if(error.status == 429) {
                setTimeout(async () => await tryThis(), 1000); 
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, msg: error.data.message });
            }
        }
    }

    await tryThis();
});

GuildRouter.get('/:id/guildMembers', async (req, res) => {
    const token = req.session.token;
    const guild_id = req.params.id;

    const tryThis = async () => {
        try {
            await axios.get(`${API_ENDPOINT}/users/@me`, {
                params: { limit: 200 },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const db_guild = await GuildModel.findOne({ guild_id: guild_id });
            if(!db_guild) {
                res.status(404);
                res.send({ code: 0, message: "Didn't find guild" });
                return;
            }

            const data = await DC.getGuildMembers(guild_id);
            const members = data.map((o: any) => {
                return {
                    id: o.user.id,
                    disc: o.user.discriminator,
                    username: o.user.username,
                    avatar: getUserIconURL(o.user, 48),
                    nickname: o.nick
                };
            });

            res.send(members);
        } catch(error: any) {
            console.log(error);
            if(error.status == 429) {
                setTimeout(async () => await tryThis(), 1000); 
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, message: error.data.message });
            }
        }
    }

    await tryThis();
});

GuildRouter.get('/:id/connected', async (req, res) => {
    const token = req.session.token;
    const guild_id = req.params.id;

    const tryThis = async () => {
        try {
            await axios.get(`${API_ENDPOINT}/users/@me`, {
                params: { limit: 200 },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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
            if(error.status == 429) {
                setTimeout(async () => await tryThis(), 1000); 
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, message: error.data.message });
            }
        }
    }

    await tryThis();
});

GuildRouter.post('/:id/connected', async (req, res) => {
    const guild_id = req.params.id;
    const db_guild = await GuildModel.findOne({ guild_id: guild_id });
    if(!db_guild) {
        res.status(404);
        res.send({ code: 0, message: "Didn't find guild." });
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

    res.send();
});

GuildRouter.get('/:id/channels', async (req, res) => {
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

export default GuildRouter;