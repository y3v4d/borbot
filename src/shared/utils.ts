import * as jwt from 'jsonwebtoken';
import Code from './code';
import logger, { LoggerType } from './logger';

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

export function addCommas(n: number | string) {
    const temp = n.toString();
    
    return temp.length < 5 ? temp : temp.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

export function generateAccessToken(uid: string) {
    return jwt.sign({ uid: uid }, process.env.TOKEN_SECRET as string, { expiresIn: 3600 });
}

export function decryptAccessToken(token: string) {
    return new Promise<{ uid: string }>((resolve, reject) => {
        jwt.verify(token, process.env.TOKEN_SECRET as string, (err, user) => {
            if(err) {
                logger(`Decrypt token error: ${err.message}`, LoggerType.ERROR);
                reject({ code: Code.TOKEN_ERROR, message: "Token error" });
                return;
            }
    
            resolve({ uid: (user as jwt.JwtPayload).uid });
        });
    });
}

export function getDateMidnight(date = new Date()) {
    date.setUTCHours(0, 0, 0, 0);

    return date;
}

export function dateToString(date: Date, format = "Y-M-D") {
    let output = format.replaceAll(/Y+/g, date.getUTCFullYear().toString())
        .replaceAll(/M+/g, (date.getUTCMonth() + 1).toString().padStart(2, '0'))
        .replaceAll(/D+/g, date.getUTCDate().toString().padStart(2, '0'))
        .replaceAll(/h+/g, date.getUTCHours().toString().padStart(2, '0'))
        .replaceAll(/m+/g, date.getUTCMinutes().toString().padStart(2, '0'))
        .replaceAll(/s+/g, date.getUTCSeconds().toString().padStart(2, '0'));

    return output;
}

export function dateDifference(self: Date, other: Date) {
    return (self.getTime() - other.getTime()) / 86400000;
}