import GuildModel from "../models/guild";
import MemberModel from "../models/member";
import { IGuild, IGuildChat, IGuildMilestone, IGuildRaid, IGuildRemind, IGuildSchedule } from "../models/types/guild.types";
import { IMember } from "../models/types/member.types";
import InMemoryCache from "../shared/cache";
import { ClanMember } from "./clan.service";
import { flattenObject, mapUpdate, mapUpdateAdvanced, mapUpdateNamed } from "../shared/utils";
import { DeepPartial } from "mongoose";

export type GuildUpdateParams = DeepPartial<Omit<IGuild,
    '_id' | 'guild_id' | 'clan_name' | 'user_uid' | 'password_hash'
>>;

export type MemberUpdateParams = Partial<Pick<IMember,
    'highest_milestone'
>>

class GuildService {
    private _cacheGuild: InMemoryCache<IGuild | null> = new InMemoryCache(5 * 60 * 1000);
    private _cacheGuildKey = (id: string) => `guild:${id}`;

    private _allGuildIdsCache = new Set<string>();

    async addGuild(guild_id: string, uid: string, pwd: string, clanName: string) {
        const guild = new GuildModel({ guild_id: guild_id, user_uid: uid, password_hash: pwd, clan_name: clanName });
        await guild.save();

        const lean = guild.toObject();
        this._cacheGuild.set(this._cacheGuildKey(guild_id), lean);
        this._allGuildIdsCache.add(guild_id);

        return lean;
    }

    async setGuildRaid(guild_id: string, raid: DeepPartial<IGuildRaid>) {
        const update = mapUpdateAdvanced(raid, {
            channel: (channel) => mapUpdate(channel!, ["id", "valid"]),
            fight_role: (role) => mapUpdate(role!, ["id", "valid"]),
            claim_role: (role) => mapUpdate(role!, ["id", "valid"]),
            status: (status) => status,
            last_update: (last_update) => last_update
        });

        if(Object.keys(update).length === 0) {
            return;
        }

        const flattened = flattenObject(update, "raid");
        await GuildModel.updateOne({ guild_id: guild_id }, { $set: flattened });

        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async hasGuildRaid(guild_id: string) {
        const exists = await GuildModel.exists({ guild_id: guild_id, raid: { $exists: true } });
        return !!exists;
    }

    async unsetGuildRaid(guild_id: string) {
        await GuildModel.updateOne({ guild_id: guild_id }, { $unset: { raid: "" } });
        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async setGuildRemind(guild_id: string, remind: DeepPartial<IGuildRemind>) {
        const update = mapUpdateAdvanced(remind, {
            channel: (channel) => mapUpdate(channel!, ["id", "valid"]),
            last_update: (last_update) => last_update
        });

        if(Object.keys(update).length === 0) {
            return;
        }

        const flattened = flattenObject(update, "remind");
        await GuildModel.updateOne({ guild_id: guild_id }, { $set: flattened });

        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async hasGuildRemind(guild_id: string) {
        const exists = await GuildModel.exists({ guild_id: guild_id, remind: { $exists: true } });
        return !!exists;
    }

    async unsetGuildRemind(guild_id: string) {
        await GuildModel.updateOne({ guild_id: guild_id }, { $unset: { remind: "" } });
        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async setGuildChat(guild_id: string, chat: DeepPartial<IGuildChat>) {
        const update = mapUpdateAdvanced(chat, {
            channel: (channel) => mapUpdate(channel!, ["id", "valid"]),
            last_update: (last_update) => last_update
        });

        if(Object.keys(update).length === 0) {
            return;
        }

        const flattened = flattenObject(update, "chat");
        await GuildModel.updateOne({ guild_id: guild_id }, { $set: flattened });

        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async hasGuildChat(guild_id: string) {
        const exists = await GuildModel.exists({ guild_id: guild_id, chat: { $exists: true } });
        return !!exists;
    }

    async unsetGuildChat(guild_id: string) {
        await GuildModel.updateOne({ guild_id: guild_id }, { $unset: { chat: "" } });
        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async setGuildMilestone(guild_id: string, milestone: DeepPartial<IGuildMilestone>) {
        const update = mapUpdateAdvanced(milestone, {
            channel: (channel) => mapUpdate(channel!, ["id", "valid"])
        });

        if(Object.keys(update).length === 0) {
            return;
        }

        const flattened = flattenObject(update, "milestone");
        await GuildModel.updateOne({ guild_id: guild_id }, { $set: flattened });

        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async hasGuildMilestone(guild_id: string) {
        const exists = await GuildModel.exists({ guild_id: guild_id, milestone: { $exists: true } });
        return !!exists;
    }

    async unsetGuildMilestone(guild_id: string) {
        await GuildModel.updateOne({ guild_id: guild_id }, { $unset: { milestone: "" } });
        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async setGuildSchedule(guild_id: string, schedule: DeepPartial<IGuildSchedule>) {
        const update = mapUpdateAdvanced(schedule, {
            channel: (channel) => mapUpdate(channel!, ["id", "valid"]),
            message_id: (message_id) => message_id,
            cycle_start: (cycle_start) => {
                if(cycle_start) {
                    cycle_start.setUTCHours(0, 0, 0, 0);
                }

                return cycle_start;
            },
            list: (list) => {
                if(!list) {
                    return list;
                }

                if(list.length != 10) {
                    throw new Error("Schedule list must have exactly 10 entries");
                }

                for(const entry of list) {
                    if(entry === null) continue;

                    if(typeof entry !== "string") {
                        throw new Error("Schedule list entries must be clan UIDs or null");
                    }
                }

                return list.map(entry => entry ?? null);
            },
            last_update: (last_update) => last_update
        });

        if(Object.keys(update).length === 0) {
            return;
        }

        const flattened = flattenObject(update, "schedule");
        await GuildModel.updateOne({ guild_id: guild_id }, { $set: flattened });

        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async hasGuildSchedule(guild_id: string) {
        const exists = await GuildModel.exists({ guild_id: guild_id, schedule: { $exists: true } });
        return !!exists;
    }

    async unsetGuildSchedule(guild_id: string) {
        await GuildModel.updateOne({ guild_id: guild_id }, { $unset: { schedule: "" } });
        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async getGuild(id: string) {
        const cached = this._cacheGuild.get(this._cacheGuildKey(id));
        if(cached !== undefined) {
            return cached;
        }

        const guild = await GuildModel.findOne({ guild_id: id }).lean();
        this._cacheGuild.set(this._cacheGuildKey(id), guild ?? null);

        return guild ?? null;
    }

    async removeGuild(id: string) {
        await MemberModel.deleteMany({ guild_id: id });
        await GuildModel.deleteOne({ guild_id: id });

        this._cacheGuild.delete(this._cacheGuildKey(id));
        this._allGuildIdsCache.delete(id);
    }

    async addGuildMember(guild_id: string, clan_uid: string, data: ClanMember) {
        const member = new MemberModel({
            guild_id: guild_id,
            clan_uid: clan_uid,
            nickname: data.nickname,
            highest_zone: data.highestZone,
            level: data.level,
            role: data.class,
            highest_milestone: -1
        });

        await member.save();
        return member.toObject();
    }

    async linkDiscord(guild_id: string, clan_uid: string, discord: { user_id: string, username: string, avatar: string | null }) {
        await MemberModel.updateOne({ guild_id, clan_uid }, { $set: {
            discord: {
                user_id: discord.user_id,
                username: discord.username,
                avatar: discord.avatar,
                cached_at: new Date()
            }
        }});
    }

    async syncAllDiscordLink(discord_uid: string, params: { username?: string, avatar?: string | null }) {
        const update = mapUpdateNamed(params, {
            username: "discord.username",
            avatar: "discord.avatar"
        });

        console.log("Syncing discord link for discord UID", discord_uid, "with update", update);

        if(Object.keys(update).length === 0) {
            return;
        }

        await MemberModel.updateMany({ "discord.user_id": discord_uid }, { $set: {
            ...update,
            "discord.cached_at": new Date()
        }});
    }

    async unlinkDiscord(guild_id: string, clan_uid: string) {
        await MemberModel.updateOne({ guild_id, clan_uid }, { $unset: {
            "discord": ""
        }});
    }

    async invalidateDiscordChannel(guild_id: string, channel_id: string) {
        const guild = await this.getGuild(guild_id);
        if(!guild) {
            return;
        }

        const paths = [
            "raid",
            "remind",
            "chat",
            "milestone",
            "schedule"
        ] as const;

        const fields: Record<string, boolean> = {};
        for(const path of paths) {
            const channel = guild[path]?.channel;
            if(channel && channel.id === channel_id) {
                fields[`${path}.channel.valid`] = false;
            }
        }

        if(Object.keys(fields).length === 0) {
            return;
        }

        await GuildModel.updateOne({ guild_id: guild_id }, { $set: fields });
        this._cacheGuild.delete(this._cacheGuildKey(guild_id));
    }

    async removeAllDiscordLinks(discord_uids: string[]) {
        await MemberModel.updateMany({ "discord.user_id": { $in: discord_uids } }, { $unset: {
            "discord": ""
        }});
    }

    async removeAllDiscordLink(discord_uid: string) {
        await MemberModel.updateMany({ "discord.user_id": discord_uid }, { $unset: {
            "discord": ""
        }});
    }

    async syncClickerHeroesInfo(guild_id: string, clan_uid: string, data: ClanMember) {
        await MemberModel.updateOne({ guild_id, clan_uid }, { $set: {
            nickname: data.nickname,
            highest_zone: data.highestZone,
            level: data.level,
            role: data.class
        }});
    }

    async updateClickerHeroesInfo(clan_uid: string, data: Partial<ClanMember>) {
        const update = mapUpdate(data, [
            "nickname",
            "highestZone",
            "level",
            "class"
        ]);

        if(Object.keys(update).length === 0) {
            return;
        }

        await MemberModel.updateOne({ clan_uid }, { $set: { ...update } });
    }

    async getAllGuildIDs() {
        if(this._allGuildIdsCache.size > 0) {
            return Array.from(this._allGuildIdsCache);
        }

        const guilds = await GuildModel.find({}, { guild_id: 1, _id: 0 }).lean();
        const guildIDs = guilds.map(o => o.guild_id);
        
        for(const id of guildIDs) {
            this._allGuildIdsCache.add(id);
        }

        return guildIDs;
    }

    async isGuildSetup(id: string) {
        const guild = await this.getGuild(id);
        return guild !== null;
    }

    async getGuildMember(id: string) {
        const member = await MemberModel.findOne({ _id: id }).lean();
        return member ?? null;
    }

    async getGuildMemberByDiscordUID(guild_id: string, discord_uid: string) {
        const member = await MemberModel.findOne({ guild_id: guild_id, "discord.user_id": discord_uid }).lean();
        return member ?? null;
    }

    async getGuildMemberByClanUID(guild_id: string, clan_uid: string) {
        const member = await MemberModel.findOne({ guild_id: guild_id, clan_uid: clan_uid }).lean();
        return member ?? null;
    }

    async getGuildMemberByNickname(guild_id: string, nickname: string) {
        const member = await MemberModel.findOne({ guild_id: guild_id, nickname: nickname }).lean();
        return member ?? null;
    }

    async getGuildMembers(guild_id: string) {
        const members = await MemberModel.find({ guild_id: guild_id }).lean();
        return members;
    }

    async updateMember(id: string, params: MemberUpdateParams) {
        const update = mapUpdate(params, ["highest_milestone"]);

        if(Object.keys(update).length === 0) {
            return;
        }

        await MemberModel.updateOne({ _id: id }, { $set: update });
    }

    async removeGuildMember(guild_id: string, clan_uid: string) {
        const member = await MemberModel.findOne({ guild_id: guild_id, clan_uid: clan_uid }).lean();
        if(!member) {
            return;
        }

        const operations: Promise<any>[] = [];
        operations.push(MemberModel.deleteOne({ guild_id: guild_id, clan_uid: clan_uid }));

        const guild = await this.getGuild(guild_id);
        if(guild) {
            const list = guild.schedule?.list;
            if(list) {
                const newList = list.map(id => id ?? null);
                let isUpdate = false;

                for(let i = 0; i < newList.length; i++) {
                    if(newList[i] === clan_uid) {
                        newList[i] = null;
                        isUpdate = true;
                    }
                }

                if(isUpdate) {
                    operations.push(GuildModel.updateOne({ guild_id: guild_id }, { $set: {
                        schedule: {
                            list: newList
                        }
                    }}));
                }
            }
        }

        return Promise.allSettled(operations);
    }
}

export default GuildService;