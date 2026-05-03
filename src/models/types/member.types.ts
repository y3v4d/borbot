import { Types } from "mongoose"

export interface IDiscordLink {
    user_id: string,
    username: string,
    avatar: string,
    cached_at: Date
}

export interface IMember {
    _id?: Types.ObjectId,

    guild_id: string,
    clan_uid: string,

    nickname: string,
    highest_zone: number,

    level: number,
    role: number,

    highest_milestone: number,

    discord?: IDiscordLink
}