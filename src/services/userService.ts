import DiscordAPI from "../api/discord";
import UserModel, { IUser, IUserGuild } from "../models/user";
import Code from "../shared/code";
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

    export async function getUser(id: string) {
        const user = await UserModel.findOne({ id: id });
        if(!user) {
            throw {
                code: Code.USER_NOT_REGISTERED,
                message: "User doesn't exist"
            }
        }

        return user;
    }

    export async function getUserInformation(token: string) {
        const user = await UserModel.findOne({ token: token });
        if(!user) {
            throw {
                code: Code.USER_NOT_REGISTERED, 
                message: `User doesn't exist` 
            };
        }

        const info = await DiscordAPI.getUserInformation(token);
        return info;
    }

    export async function getUserGuilds(token: string) {
        const user = await UserModel.findOne({ token: token });
        if(!user) {
            throw {
                code: Code.USER_NOT_REGISTERED, 
                message: `User doesn't exist` 
            };
        }

        const isLastUpdated = user.last_update_guilds && Date.now() - user.last_update_guilds < 60000;
        if(isLastUpdated) {
            return user.guilds as IUserGuild[];
        }

        try {
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

            logger(`Fetched guilds for user ${user.id}`);

            await user.updateOne({ guilds: list, last_update_guilds: Date.now() });
            return list;
        } catch(error: any) {
            const { code, status } = error;

            if(code === Code.DISCORD_API_ERROR && status === 429) {
                return user.guilds as IUserGuild[];
            }

            throw error;
        }
    }
}

export default UserService;