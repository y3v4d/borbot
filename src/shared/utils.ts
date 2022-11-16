const CDN_ENDPOINT = 'https://cdn.discordapp.com';
const UI_ENDPOINT = 'https://ui-avatars.com/api';

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

export function isAdmin(permissions: string) {
    const ADMINISTRATOR_FLAG = (1 << 3);
    return (parseInt(permissions) & ADMINISTRATOR_FLAG) == ADMINISTRATOR_FLAG;
}