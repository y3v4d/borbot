const CDN_ENDPOINT = 'https://cdn.discordapp.com/icons';
const UI_ENDPOINT = 'https://ui-avatars.com/api';

export function getGuildIconURL(guild: any, size = 64) {
    if(guild.icon) {
        return `${CDN_ENDPOINT}/${guild.id}/${guild.icon}.png?size=${size}`;
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