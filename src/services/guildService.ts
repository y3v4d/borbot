import ClickerHeroesAPI from "../api/clickerheroes";
import Bot from "../core/bot";
import GuildModel, { IGuild } from "../models/guild";
import MemberModel, { IMember } from "../models/member";
import ScheduleModel from "../models/schedule";
import Code from "../shared/code";
import { getUserIconURL } from "../shared/utils";

export interface GuildConnectedMember {
    guild_uid: string,
    clan_uid: string
}

export interface GuildScheduleEntry {
    uid: string,
    index: number
}

class GuildService {
    private client: Bot;

    constructor(client: Bot) {
        this.client = client;
    }

    async createSetupGuild(guild_id: string, uid: string, pwd: string) {
        const guild = this.client.guilds.cache.get(guild_id);
        if(!guild) {
            throw { 
                code: Code.GUILD_REQUIRES_BOT, 
                message: 'Setup required bot in guild' 
            };
        }

        const db_guild = await GuildModel.exists({ guild_id: guild_id });
        if(db_guild) {
            throw { 
                code: Code.GUILD_ALREADY_SETUP, 
                messsage: "Guild already setup."
            };
        }

        try {
            await ClickerHeroesAPI.getGuildInfo(uid, pwd);
        } catch(error: any) {
            if(error.code === Code.CLICKERHEROES_API_FAILED) {
                throw {
                    code: Code.CLAN_INVALID_CREDENTIALS,
                    message: "Invalid clan credentials"
                };
            }

            throw error;
        }
            
        const schema: IGuild = {
            guild_id: guild_id,
            user_uid: uid,
            password_hash: pwd
        };
    
        await GuildModel.create(schema);
    }

    async removeSetupGuild(guild_id: string) {
        const dbGuild = await GuildModel.findOne({ guild_id: guild_id });
        if(!dbGuild) {
            throw { 
                code: Code.GUILD_NOT_SETUP, 
                message: "Guild isn't setup" 
            };
        }

        await dbGuild.delete();
    }

    async getGuildById(id: string) {
        const guild = await GuildModel.findOne({ guild_id: id });
        if(!guild) {
            throw {
                code: Code.GUILD_NOT_SETUP,
                message: "Guild is not setup"
            }
        }

        return guild;
    }

    async isGuildSetup(id: string) {
        const guild = await GuildModel.exists({ guild_id: id });
        return guild !== null;
    }

    async getGuildMembers(id: string) {
        const guild = this.client.guilds.cache.get(id);
        if(!guild) {
            throw { code: Code.GUILD_REQUIRES_BOT, message: `Bot required in guild` };
        }

        const fetchedMembers = await guild.members.fetch();
        const list = fetchedMembers.map(o => ({
            id: o.user.id,
            disc: o.user.discriminator,
            username: o.user.username,
            avatar: getUserIconURL(o.user, 48),
            nickname: o.nickname,
            isBot: o.user.bot || false
        }));

        return list;
    }

    async getGuildConnectedMembers(guild_id: string) {
        const isSetup = await this.isGuildSetup(guild_id);
        if(!isSetup) {
            throw {
                code: Code.GUILD_NOT_SETUP,
                message: "Guild is not setup"
            }
        }

        const dbMembers = await MemberModel.find({ guild_id: guild_id });
        const items: GuildConnectedMember[] = [];
        
        for(const member of dbMembers) {
            items.push({
                guild_uid: member.guild_uid, 
                clan_uid: member.clan_uid
            });
        }

        return items;
    }

    async updateGuildConnectedMembers(guild_id: string, list: GuildConnectedMember[]) {
        const dbGuild = await this.getGuildById(guild_id);
        
        const guildMembers = await this.getGuildMembers(guild_id);
        const clanMembers = await this.clanService.getClanMembers(dbGuild.user_uid, dbGuild.password_hash);
    
        for(const connected of list) {
            if(clanMembers.find(o => o.uid === connected.clan_uid)) {
                if(connected.guild_uid == "none") {
                    await MemberModel.findOneAndDelete({ clan_uid: connected.clan_uid, guild_id: guild_id });
                } else if(guildMembers.find(o => o.id === connected.guild_uid)) {
                    await MemberModel.findOneAndUpdate(
                        { clan_uid: connected.clan_uid, guild_id: guild_id }, 
                        { guild_uid: connected.guild_uid },
                        { upsert: true }
                    );
                } else {
                    console.warn(`Invalid information (guild_uid: ${connected.guild_uid})`);
                }
            } else {
                console.warn(`Invalid information (clan_uid: ${connected.clan_uid})`);
            }
        }
    }

    async getGuildSchedule(id: string) {
        const dbGuild = await this.getGuildById(id);

        const dbSchedule = await ScheduleModel.findOne({ _id: dbGuild.schedule })
            .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
        if(!dbSchedule) {
            throw {
                code: Code.GUILD_NO_SCHEDULE,
                message: "No schedule in guild."
            }
        }
    
        const entries: any[] = [];
        for(let i = 1; i <= 10; ++i) {
            const entry = dbSchedule.map.find(o => o.index == i);
            entries.push({ uid: entry ? entry.member.guild_uid : '', index: i });
        }
    
        const MS_IN_DAY = 86400000;
        return {
            id: id,
            start: dbSchedule.start_day,
            next_cycle: new Date(new Date(dbSchedule.start_day).getTime() + 10 * MS_IN_DAY),
            entries: entries
        };
    }

    async updateGuildSchedule(id: string, list: GuildScheduleEntry[]) {
        const dbSchedule = await ScheduleModel.findOne({ guild_id: id })
            .populate<{ map: [{ member: IMember, index: number }]}>("map.member");
        if(!dbSchedule) {
            throw {
                code: Code.GUILD_NO_SCHEDULE,
                message: "No schedule in guild."
            }
        }
    
        for(let i = 0; i < dbSchedule.length; ++i) {
            const guild_uid = list.find(o => o.index == i + 1)?.uid;
            if(!guild_uid) {
                console.warn("Didn't find index, skipping...");
                continue;
            }
    
            const dbMember = await MemberModel.findOne({ guild_uid: guild_uid });
            if(!dbMember) {
                throw {
                    code: Code.MEMBER_NOT_EXIST, 
                    msg: `Guild member doesn't exist` 
                }
            }
    
            const entry = dbSchedule.map.find(o => o.index === i + 1);
            if(!entry) {
                console.warn(`Didn't find entry with index ${i + 1}. Creating...`);
                dbSchedule.map.push({ member: dbMember, index: i + 1 });
                continue;
            }
    
            if(entry.member.guild_uid === guild_uid) {
                continue;
            }
    
            entry.member = dbMember;
        }
    
        await dbSchedule.save();
    }

    private get clanService() {
        return this.client.clanService;
    }
}

export default GuildService;