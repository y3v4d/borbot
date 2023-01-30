import axios from 'axios';
import Code from '../shared/code';

namespace DiscordAPI {
    export async function request<T>(method: 'get' | 'post', path: string, data: { params?: any, headers?: any }) {
        try {
            const response = await axios({
                method: method,
                url: `https://discord.com/api/v10/${path}`,
                params: method === 'get' ? data.params : undefined,
                data: method === 'post' ? data.params : undefined,
                headers: data.headers
            });

            return response.data as T;
        } catch(error: any) {
            if (error.response) {
                throw ({
                    code: Code.DISCORD_API_ERROR,

                    data: error.response.data,
                    status: error.response.status
                });
            } else if (error.request) {
                throw ({
                    code: Code.NO_RESPONSE
                });
            } else {
                throw ({
                    code: Code.INTERNAL_SERVER_ERROR,
                    message: error.message
                });
            }
        }
    }

    export type AuthTokenResponse = { 
        access_token: string,
        token_type: string,
        expires_in: number,
        refresh_token: string,
        scope: string
    }

    export async function getAuthToken(clientID: string, clientSecret: string, clientCode: string) {
        const params: any = {
            client_id: clientID,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: clientCode,
            redirect_uri: 'http://127.0.0.1:3010/api/auth'
        };

        return await request<AuthTokenResponse>('post', 'oauth2/token', {
            params: new URLSearchParams(params)
        });
    }

    export type UserInformationResponse = {
        id: string,
        username: string,
        discriminator: string,
        avatar: string
    }

    export async function getUserInformation(token: string) {
        return await request<UserInformationResponse>('get', 'users/@me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    export type UserGuildResponse = {
        id: string,
        name: string,
        icon: string,
        owner: boolean,
        permissions: string,
        features: string[]
    }[]

    export async function getUserGuilds(token: string) {
        return await request<UserGuildResponse>('get', 'users/@me/guilds', {
            params: { limit: 100 },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    export async function getUserInGuild(token: string, guildID: string) {
        return await request<any>('get', `users/@me/guilds/${guildID}/member`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    export async function getGuild(guildID: string) {
        const token = process.env.TOKEN as string;

        return await request<any>('get', `guilds/${guildID}`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        });
    }

    export type GuildMember = {
        user?: {
            id: string,
            username: string,
            discriminator: string,
            avatar?: string,
            bot?: boolean,
            system?: boolean,
            mfa_enabled?: boolean,
            banner?: string,
            accent_color?: number,
            locale?: string,
            verified?: boolean,
            email?: string,
            flags?: number,
            premium_type?: number,
            public_flags?: number
        },
        nick?: string,
        avatar?: string,
        roles: string[],
        joined_at: string,
        premium_since?: string,
        deaf: boolean,
        mute: boolean,
        pending?: boolean,
        permissions?: string,
        communication_disabled_until?: string
    }

    export async function getGuildMembers(guildID: string, limit = 100) {
        const token = process.env.TOKEN as string;

        return await request<GuildMember[]>('get', `guilds/${guildID}/members`, {
            params: { limit: limit },
            headers: {
                'Authorization': `Bot ${token}`
            }
        });
    }

    export async function getGuildChannels(guildID: string) {
        const token = process.env.TOKEN as string;

        return await request<any>('get', `guilds/${guildID}/channels`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        });
    }
}

export default DiscordAPI;