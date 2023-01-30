import axios from 'axios';
import * as https from 'https';
import Code from '../shared/code';

namespace ClickerHeroesAPI {
    type Response<T> = {
        success: boolean

        reason?: string
        result?: T
    }

    async function request<T>(request: string, params: any) {
        const ENDPOINT = 'http://ClickerHeroes-SavedGames3-747864888.us-east-1.elb.amazonaws.com';
        
        try {
            const response = await axios({
                method: 'post',
                url: `${ENDPOINT}/clans/${request}.php`,
                params: params,
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                }
            });

            const data = response.data as Response<T>;
            if(!data.success) {
                throw {
                    code: Code.CLICKERHEROES_API_FAILED,
                    message: data.reason!
                }
            }

            return data.result!;
        } catch(error: any) {
            if(error.code === Code.CLICKERHEROES_API_FAILED) {
                throw error;
            } else if (error.response) {
                throw ({
                    code: Code.CLICKERHEROES_API_ERROR,

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

    export interface GuildInfoResultMember {
        uid: string,
        highestZone: string,
        nickname: string,
        chosenClass: string,
        classLevel: string,
        lastRewardTimestamp: string,
        lastBonusRewardTimestamp: string
    }

    export interface GuildInfoResult {
        guild: {
            name: string,
            guildMasterUid: string,
            memberUids: {
                [key: string]: "member"
            },
            currentRaidLevel: number,
            autoJoin: boolean,
            currentNewRaidLevel: number,
            newRaidLocked: string
        },
        guildMembers: {
            [key: string]: GuildInfoResultMember
        },
        user: {
            uid: string,
            passwordHash: string,
            highestZone: string,
            nickname: string,
            isGuildRequest: boolean,
            guildName: string,
            chosenClass: string,
            classLevel: string,
            lastRewardTimestamp: string,
            lastBonusRewardTimestamp: string
        }
    }

    export interface NewRaid {
        guildName: string,
        level: string,
        date: string,
        scores: {
            [key: string]: string
        },
        bonusScores: {
            [key:string]: string
        },
        weakness: number,
        isSuccessful: boolean,
        isBonusAvailable: boolean,
        isBonusSuccessful: boolean
    }

    export interface NewRaidResult {
        raid: NewRaid
    }

    interface RawGuildMessages {
        [key: string]: string
    }

    export interface GuildMessage {
        uid: string,
        content: string,
        timestamp: number
    }

    export interface RawGuildMessagesResult {
        guildName: string,
        messages: RawGuildMessages
    }

    export interface GuildMessagesResult {
        guildName: string,
        messages: GuildMessage[]
    }

    export async function getGuildInfo(uid: string, pwd: string) {
        return await request<GuildInfoResult>('getGuildInfo', { uid: uid, passwordHash: pwd });
    }

    export async function getNewRaid(uid: string, pwd: string, guildName: string) {
        const data = await request<NewRaidResult>('getNewRaid', { uid: uid, passwordHash: pwd, guildName: guildName });
        return data.raid;
    }

    export async function getGuildMessages(uid: string, pwd: string, guildName: string) {
        const data = await request<RawGuildMessagesResult>('getGuildMessages', { uid: uid, passwordHash: pwd, guildName: guildName, timestamp: (Date.now() / 1000) });
        const messages = data.messages;

        const result: GuildMessagesResult = {
            guildName: data.guildName,
            messages: []
        };

        for(const key in messages) {
            const split = messages[key].split(';', 2);
            result.messages.push({ timestamp: parseFloat(key), uid: split[0], content: split[1] });
        }

        return result;
    }
}

export default ClickerHeroesAPI;