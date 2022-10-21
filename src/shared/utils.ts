import axios from "axios";

const CDN_ENDPOINT = 'https://cdn.discordapp.com';
const UI_ENDPOINT = 'https://ui-avatars.com/api';

const API_ENDPOINT = "https://discord.com/api/v10";

export function getGuildIconURL(guild: any, size = 64) {
    if(guild.icon) {
        return `${CDN_ENDPOINT}/icons/${guild.id}/${guild.icon}.png?size=${size}`;
    } else {
        const params = {
            name: guild.name,
            background: "494d54",
            uppercase: "false",
            color: "dbdcdd",
            "font-size": "0.33",
            size: size.toString()
        };

        return `${UI_ENDPOINT}?${new URLSearchParams(params).toString()}`;
    }
}

export function getUserIconURL(user: any, size = 64) {
    if(user.avatar) {
        return `${CDN_ENDPOINT}/avatars/${user.id}/${user.avatar}.png?size=${size}`;
    } else {
        const params = {
            name: user.username,
            background: "494d54",
            uppercase: "false",
            color: "dbdcdd",
            "font-size": "0.33",
            size: size.toString()
        };

        return `${UI_ENDPOINT}?${new URLSearchParams(params).toString()}`;
    }
}

export async function getValidGuilds(token: string) {
    const res = await axios.get(`${API_ENDPOINT}/users/@me/guilds`, {
        params: { limit: 200 },
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}