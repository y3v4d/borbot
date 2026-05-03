import { Types } from "mongoose"

export interface IRoleRef {
    id: string,
    valid: boolean
}

export interface IChannelRef {
    id: string,
    valid: boolean
}

export interface IMessageRef {
    id: string,
    valid: boolean
}

export enum RaidStatus {
    NONE = 0,
    FIRST_RAID_AVAILABLE = 1,
    BONUS_RAID_AVAILABLE = 2,
    BONUS_RAID_SUCCESS = 3
}

export interface IGuildRaid {
    channel: IChannelRef,
    fight_role?: IRoleRef,
    claim_role?: IRoleRef,

    status: RaidStatus,
    last_update?: Date
}

export interface IGuildRemind {
    channel: IChannelRef,
    last_update?: Date
}

export interface IGuildChat {
    channel: IChannelRef,
    last_update?: Date
}

export interface IGuildMilestone {
    channel: IChannelRef,
}

export interface IGuildSchedule {
    channel?: IChannelRef,
    message_id?: string,

    cycle_start: Date,
    list: (string | null)[],

    last_update?: Date
}

export interface IGuild {
    _id?: Types.ObjectId,

    guild_id: string,

    user_uid: string,
    password_hash: string,
    clan_name: string,
    
    raid?: IGuildRaid,
    remind?: IGuildRemind,
    chat?: IGuildChat,
    milestone?: IGuildMilestone,
    
    schedule?: IGuildSchedule
}