import DiscordAPI from "../api/discord";
import UserModel, { IUser, IUserGuild } from "../models/user";
import logger from "../shared/logger";
import { getGuildIconURL, isAdmin } from "../shared/utils";

namespace UserService {
    export async function createUser(data: { id: string, token: string }) {
        const user: IUser = {
            id: data.id,
            token: data.token
        };

        const existing = await UserModel.findOne({ id: data.id });
        if(existing) {
            existing.token = data.token;
            await existing.save();
        } else {
            await UserModel.create(user);
        }
    }

    export async function removeUser(data: { id?: string, token?: string }) {
        if(!data.id && data.token) {
            logger("removeUser has to be provided with either id or token");
            return;
        }

        if(data.id) {
            await UserModel.deleteOne({ id: data.id });
        } else {
            await UserModel.deleteOne({ token: data.token });
        }
    }

    export async function getUserById(id: string) {
        return await UserModel.find({ id: id });
    }

    export async function getUserByToken(token: string) {
        return await UserModel.find({ token: token });
    }

    export async function getUserGuilds(token: string) {
        const user = await UserModel.findOne({ token: token });
        if(!user) {
            throw new Error(`Couldn't get user with token ${token}.`);
        }

        if(!user.last_update_guilds || Date.now() - user.last_update_guilds >= 60000) {
            logger(`Fetching guilds for user ${user.id}`);

            const data = await DiscordAPI.getUserGuilds(user.token);

            const list: IUserGuild[] = [];
            for(const guild of data) {
                list.push({ 
                    name: guild.name, 
                    id: guild.id, 
                    icon: getGuildIconURL(guild), 
                    permissions: guild.permissions,
                    isAdmin: isAdmin(guild.permissions)
                });
            }

            await user.updateOne({ guilds: list, last_update_guilds: Date.now() });
            return list;
        }
        
        return user.guilds as IUserGuild[];
    }
}

export default UserService;