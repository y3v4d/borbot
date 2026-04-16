import DiscordAPI from "../api/discord";
import UserModel from "../models/user";
import InMemoryCache from "../shared/cache";
import Code from "../shared/code";
import logger from "../shared/logger";
import { singleFlight } from "../shared/single-flight.decorator";
import { isAdmin } from "../shared/utils";

export interface IUserGuild {
    id: string, 
    name: string, 
    icon: string, 
    permissions: string,
    isAdmin: boolean,
    owner: boolean
}

class UserService {
    private _cache: InMemoryCache<IUserGuild[]> = new InMemoryCache(60 * 1000);

    async ensureUserExistsSynced(discord_token: string) {
        const info = await DiscordAPI.getUserInformation(discord_token);
        const id = info.id;

        let user = await UserModel.findOne({ id: id });
        if(!user) {
            user = new UserModel({ 
                id: id,
            });
        }
        
        user.set({
            username: info.username,
            avatar: info.avatar,
            discriminator: info.discriminator,
            last_user_sync: Date.now()
        });

        await user.save();
        return user.toObject();
    }

    async getUser(id: string) {
        const user = await UserModel.findOne({ id: id });
        if(!user) return null;

        return user.toObject();
    }

    @singleFlight((user_id: string) => `getUserGuilds:${user_id}`)
    async getUserGuilds(user_id: string, discord_token: string) {
        const cached = this._cache.get(user_id);
        if(cached !== undefined) {
            return cached;
        }

        const guilds = await DiscordAPI.getUserGuilds(discord_token);
        const list: IUserGuild[] = [];
        for(const guild of guilds) {
            const canAdd = isAdmin(guild.permissions) || guild.owner;
            if(!canAdd) continue;
            
            list.push({ 
                name: guild.name, 
                id: guild.id, 
                icon: guild.icon, 
                permissions: guild.permissions,
                isAdmin: isAdmin(guild.permissions),
                owner: guild.owner
             });
        }

        logger(`Fetched guilds for user ${user_id} from Discord API`);
        this._cache.set(user_id, list);

        return list;
    }

    async removeUser(id: string) {
        await UserModel.deleteOne({ id: id });
    }

    async syncUserInfo(user_id: string, discord_token: string) {
        const user = await UserModel.findOne({ id: user_id });
        if(!user) {
            throw { code: Code.USER_NOT_REGISTERED, message: "Invalid user" };
        }

        const info = await DiscordAPI.getUserInformation(discord_token);
        await user.updateOne({ 
            username: info.username,
            avatar: info.avatar,
            discriminator: info.discriminator,
            last_user_sync: Date.now()
        });

        return user.toObject();
    }
}

export default UserService;