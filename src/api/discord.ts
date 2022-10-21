import axios, { AxiosResponse } from 'axios';
import https from 'https';

namespace DC {
    function request<T>(method: 'get' | 'post', path: string, data: { params?: any, headers?: any }) {
        return new Promise<T>((resolve, reject) => {
            axios({
                method: method,
                url: `https://discord.com/api/v10/${path}`,
                params: method === 'get' ? data.params : undefined,
                data: method === 'post' ? data.params : undefined,
                headers: data.headers
            }).then(res => {
                resolve(res.data);
            }).catch(err => {
                reject({
                    data: err.response.data,
                    status: err.response.status
                });
            });
        });
    }

    type AuthTokenResponse = { 
        access_token: string,
        token_type: string,
        expires_in: number,
        refresh_token: string,
        scope: string
    }

    type UserInformationResponse = {
        id: string,
        username: string,
        discriminator: string,
        avatar: string
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

    export async function getUserInformation(token: string) {
        return await request<any>('get', 'users/@me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    export async function getUserGuilds(token: string) {
        return await request<any>('get', 'users/@me/guilds', {
            params: { limit: 100 },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    export async function getGuildMembers(guildID: string, limit = 100) {
        const token = process.env.TOKEN as string;

        return await request<any>('get', `guilds/${guildID}/members`, {
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

export default DC;