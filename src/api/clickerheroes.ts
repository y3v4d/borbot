import axios from 'axios';
import Code from '../shared/code';
import logger, { LoggerType } from '../shared/logger';

namespace ClickerHeroesAPI {
    type Response<T> = {
        success: boolean

        reason?: string
        result?: T
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

    export interface GuildInfoMember {
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

    export async function getGuildMessages(uid: string, pwd: string, guildName: string, timestamp = Date.now()) {
        return await request<GuildMessagesResult>(
            'getGuildMessages', 
            { 
                uid: uid, 
                passwordHash: pwd, 
                guildName: guildName, 
                timestamp: (timestamp / 1000) 
            }
        );
    }

    async function request<T>(request: string, params: any) {
        const now = Date.now();
        const ENDPOINT = 'https://guilds.clickerheroes.com';
        
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
                    message: data.reason || 'Unknown error'
                }
            }

            logger(`ClickerHeroesAPI ${request} request successful (took ${Date.now() - now}ms)`);

            return data.result!;
        } catch(error: any) {
            logger(`ClickerHeroesAPI ${request} request failed (took ${Date.now() - now}ms)`, LoggerType.ERROR);
            
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
}

export default ClickerHeroesAPI;