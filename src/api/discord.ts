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
                    path: path,

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

    export type UserInformationResponse = {
        id: string,
        username: string,
        discriminator: string,
        avatar: string
    }

    export type UserGuildResponse = {
        id: string,
        name: string,
        icon: string,
        owner: boolean,
        permissions: string,
        features: string[]
    }[]

    export async function getAuthToken(clientID: string, clientSecret: string, clientCode: string) {
        const params: any = {
            client_id: clientID,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: clientCode,
            redirect_uri: `${process.env.SERVER_ADDRESS}:3010/api/auth`
        };

        return await request<AuthTokenResponse>('post', 'oauth2/token', {
            params: new URLSearchParams(params)
        });
    }

    export async function getUserInformation(token: string) {
        return await request<UserInformationResponse>('get', 'users/@me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    export async function getUserGuilds(token: string, limit = 100) {
        return await request<UserGuildResponse>('get', 'users/@me/guilds', {
            params: { limit: limit },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
}

export default DiscordAPI;