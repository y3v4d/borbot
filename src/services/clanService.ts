import ClickerHeroesAPI from "../api/clickerheroes";
import Code from "../shared/code";

export enum ClanClass {
    Rogue = 1,
    Mage = 2,
    Priest = 3,
    Undefined = -1
}

export interface ClanMember {
    uid: string,
    highestZone: number,
    nickname: string,
    class: number,
    level: number,
    lastRewardTimestamp: string,
    lastBonusRewardTimestamp: string
}

export interface ClanNewRaid {
    level: number,
    date: string,

    scores: {
        uid: string,
        score: string
    }[],

    bonusScores: {
        uid: string,
        score: string
    }[],

    weakness: ClanClass,

    isSuccessful: boolean,
    isBonusAvailable: boolean,
    isBonusSuccessful: boolean
}

class ClanService {
    async getClanInformation(uid: string, pwd: string) {
        try {
            const data = await ClickerHeroesAPI.getGuildInfo(uid, pwd);

            return data;
        } catch(error: any) {
            if(error.code === Code.CLICKERHEROES_API_FAILED) {
                throw {
                    code: Code.CLAN_INVALID_CREDENTIALS,
                    message: "Invalid clan credentials"
                }
            }

            throw error;
        }
    }

    async getClanMembers(uid: string, password_hash: string) {
        try {
            const data = await ClickerHeroesAPI.getGuildInfo(uid, password_hash);
            const members: ClanMember[] = Object.values(data.guildMembers).map(member => ({
                uid: member.uid,
                highestZone: parseInt(member.highestZone),
                nickname: member.nickname,
                class: parseInt(member.chosenClass),
                level: parseInt(member.classLevel),

                lastRewardTimestamp: member.lastRewardTimestamp,
                lastBonusRewardTimestamp: member.lastBonusRewardTimestamp
            }));

            return members;
        } catch(error: any) {
            if(error.code === Code.CLICKERHEROES_API_FAILED) {
                throw {
                    code: Code.CLAN_INVALID_CREDENTIALS,
                    message: "Invalid clan credentials"
                }
            }

            throw error;
        }
    }

    async getNewRaid(uid: string, pwd: string, clanName: string) {
        try {
            const data = await ClickerHeroesAPI.getNewRaid(uid, pwd, clanName);
            const raid: ClanNewRaid = {
                level: parseInt(data.level),
                date: data.date,
                scores: [],
                bonusScores: [],
                weakness: data.weakness,
                isSuccessful: data.isSuccessful,
                isBonusAvailable: data.isBonusAvailable,
                isBonusSuccessful: data.isBonusSuccessful
            }

            for(const pair of Object.entries(data.scores)) {
                raid.scores.push({ uid: pair[0], score: pair[1] });
            }
    
            for(const pair of Object.entries(data.bonusScores)) {
                raid.bonusScores.push({ uid: pair[0], score: pair[1] });
            }

            return raid;
        } catch(error: any) {
            if(error.code === Code.CLICKERHEROES_API_FAILED) {
                throw {
                    code: Code.CLAN_INVALID_CREDENTIALS,
                    message: "Invalid clan credentials"
                }
            }

            throw error;
        }
    }

    async getClanMessages(uid: string, pwd: string, guildName: string) {
        try {
            const data = await ClickerHeroesAPI.getGuildMessages(uid, pwd, guildName);

            return data.messages;
        } catch(error: any) {
            if(error.code === Code.CLICKERHEROES_API_FAILED) {
                throw {
                    code: Code.CLAN_INVALID_CREDENTIALS,
                    message: "Invalid clan credentials"
                }
            }

            throw error;
        }
    }
}

export default ClanService;