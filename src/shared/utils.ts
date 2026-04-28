import Code from './code';
import BotClient from '../bot/client';
import { ClanClass } from '../services/clan.service';

type ValidatorFunction<T> = (value: any) => T | Promise<T>;
type InferValidator<T> = T extends ValidatorFunction<infer R> ? R : never;

type Option<T> = {
    type: ValidatorFunction<T>;
    optional?: boolean;
    nullable?: boolean;
};

const MS_IN_DAY = 86400000;

export function validate_discord_channel(client: BotClient, guild_id: string): ValidatorFunction<{ id: string }> {
    return async (value: any) => {
        if(typeof value !== 'string') throw new Error('Invalid channel ID');

        const channel = await client.getGuildChannel(guild_id, value);
        if(!channel) throw new Error('Channel not found');

        return { id: value };
    }
}

export function validate_discord_role(client: BotClient, guild_id: string): ValidatorFunction<{ id: string }> {
    return async (value: any) => {
        if(typeof value !== 'string') throw new Error('Invalid role ID');

        const role = await client.getGuildRole(guild_id, value);
        if(!role) throw new Error('Role not found');

        return { id: value };
    }
}

export function validate_str(value: any): string {
    if(typeof value !== 'string') throw new Error('Invalid string');
    return value;
}

export function validate_number(value: any): number {
    if(typeof value === 'number') return value;

    const parsed = parseFloat(value);
    if(isNaN(parsed)) throw new Error('Invalid number');

    return parsed;
}

export function validate_date(value: any): Date {
    if(typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if(isNaN(date.valueOf())) throw new Error('Invalid date');

        return date;
    }

    throw new Error('Invalid date');
}

export function validate_array<T>(itemValidator: ValidatorFunction<T>): ValidatorFunction<T[]> {
    return async (value: any) => {
        if(!Array.isArray(value)) throw new Error('Invalid array');

        const output: T[] = [];
        for(const item of value) {
            output.push(await itemValidator(item));
        }

        return output;
    }
}

export function validate_bool(value: any): boolean {
    if(typeof value === 'boolean') return value;

    if(value === 'true') return true;
    if(value === 'false') return false;
    throw new Error('Invalid boolean');
}

export async function validateParams<
    T extends Record<string, any>, 
    Options extends { [K in keyof T]?: Option<T[K]> },
>(params: T, options: Options) {
    const output: any = {};

    for(const key in options) {
        const value = params[key];
        const opt = options[key as keyof T]!;

        if(value === undefined) {
            if(opt.optional) {
                output[key] = undefined;
                continue;
            }

            throw { code: Code.BAD_REQUEST, message: `Missing parameter: ${key}` };
        }

        if(value === null) {
            if(opt.nullable) {
                output[key] = null;
                continue;
            }

            throw { code: Code.BAD_REQUEST, message: `Invalid parameter ${key}: cannot be null` };
        }

        try {
            output[key] = await opt.type(value);
        } catch(err: any) {
            throw { code: Code.BAD_REQUEST, message: `Invalid parameter ${key}: ${err.message}` };
        }
    }

    return output as { 
        [K in keyof Options]: InferValidator<NonNullable<Options[K]>['type']> |
            (NonNullable<Options[K]>['optional'] extends true ? undefined : never) |
            (NonNullable<Options[K]>['nullable'] extends true ? null : never);
    };
}

export function mapUpdateAdvanced<T>(input: T, keys: { [K in keyof T]?: (value: T[K]) => any }) {
    const out: any = {};

    for (const key in keys) {
        const value = input[key];
        if (value === undefined) continue;

        out[key] = keys[key as keyof T]!(value);
    }

    return out;
}

export function flattenObject<T extends Record<string, any>>(obj: T, prefix = '') {
    const result: Record<string, any> = {};

    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && value !== null && !isDate(value) && !Array.isArray(value)) {
            Object.assign(result, flattenObject(value, newKey));
        } else {
            result[newKey] = value;
        }
    }

    return result;
}

export function mapUpdate<T>(input: T, keys: (keyof T)[]): Partial<T> {
  const out: any = {};

  for (const key of keys) {
    const value = input[key];
    if (value === undefined) continue;

    out[key] = value || null;
  }

  return out;
}

export function isDate(value: any): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
}

export function mapUpdateNamed<T>(input: T, keyMap: { [K in keyof T]?: string }): Partial<T> {
    const out: any = {};

    for (const key in keyMap) {
        const value = input[key];
        if (value === undefined) continue;

        out[keyMap[key as keyof T]!] = value || null;
    }

    return out;
}

export function isAdmin(permissions: string) {
    const ADMINISTRATOR_FLAG = (1 << 3);
    return (parseInt(permissions) & ADMINISTRATOR_FLAG) == ADMINISTRATOR_FLAG;
}

export function printBinary(value: number) {
    console.log(value.toString(2));
}

export function addCommas(n: number | string) {
    const temp = n.toString();
    
    return temp.length < 5 ? temp : temp.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
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

export function alignCycleStart(startDate: Date, cycleLengthDays: number) {
    const now = Date.now();
    const cycleLengthMs = cycleLengthDays * MS_IN_DAY;

    let startTime = startDate.getTime();
    if(now > startTime + cycleLengthMs) {
        startTime += cycleLengthMs * Math.floor((now - startTime) / cycleLengthMs);
    }

    return new Date(startTime);
}

export function getClanRoleName(role: ClanClass) {
    switch(role) {
        case ClanClass.Rogue:
            return "Rogue";
        case ClanClass.Mage:
            return "Mage";
        case ClanClass.Priest:
            return "Priest";
        default:
            return "Undefined";
    }
}