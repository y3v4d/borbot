import axios from 'axios';
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

    export interface GuildInfoResult {
        guild: {
            name: string,
            guildMasterUid: string,
            memberUids: {
                [key: string]: "member"
            },
            currentRaidLevel: string,
            autoJoin: boolean,
            currentNewRaidLevel: number,
            newRaidLocked: string
        },
        guildMembers: {
            [key: string]: GuildInfoMember
        },
        user: GuildInfoMember | {
            passwordHash: string,
            isGuildRequest: boolean,
            guildName: string,
        }
    }

    interface GuildInfoMember {
        uid: string,
        highestZone: string,
        nickname: string,
        chosenClass: string,
        classLevel: string,
        lastRewardTimestamp: string,
        lastBonusRewardTimestamp: string
    }

    export interface GuildNewRaidResult {
        raid: {
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
    }

    export interface GuildMessagesResult {
        guildName: string,
        messages: { [key: string]: string }
    }

    export async function getGuildInfo(uid: string, pwd: string) {
        return await request<GuildInfoResult>('getGuildInfo', { uid: uid, passwordHash: pwd });
    }

    export async function getNewRaid(uid: string, pwd: string, guildName: string) {
        return await request<GuildNewRaidResult>('getNewRaid', { uid: uid, passwordHash: pwd, guildName: guildName });
    }

    export async function getGuildMessages(uid: string, pwd: string, guildName: string) {
        return await request<GuildMessagesResult>('getGuildMessages', { uid: uid, passwordHash: pwd, guildName: guildName, timestamp: (Date.now() / 1000) });
    }
}

export default ClickerHeroesAPI;