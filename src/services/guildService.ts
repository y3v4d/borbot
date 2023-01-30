import ClickerHeroesAPI from "../api/clickerheroes";
import Bot from "../core/bot";
import GuildModel, { IGuild } from "../models/guild";
import MemberModel from "../models/member";
import Code from "../shared/code";
import { getUserIconURL } from "../shared/utils";

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
        const dbGuild = await GuildModel.findOne({ guild_id: guild_id });
        if(!dbGuild) {
            throw { code: 0, message: "Didn't find guild" };
        }

        const dbMembers = await MemberModel.find({ guild_id: guild_id });
        const items: { guild_uid: string, clan_uid: string }[] = [];
        
        for(const db_member of dbMembers) {
            items.push({
                guild_uid: db_member.guild_uid, 
                clan_uid: db_member.clan_uid
            });
        }

        return items;
    }
}

export default GuildService;