import ClickerHeroesAPI from "../api/clickerheroes";
import Code from "../shared/code";

export enum ClanClass {
    Rogue = 1,
    Mage = 2,
    Priest = 3,
    Undefined = -1
}

export interface Clan {
    name: string,
    masterUid: string,

    members: ClanMember[],

    currentRaidLevel: number,
    currentNewRaidLevel: number,
    newRaidLocked: boolean,

    autoJoin: boolean
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

export interface ClanMessage {
    uid: string,
    content: string,
    timestamp: number
}

class ClanService {
    async getClanInformation(uid: string, pwd: string) {
        try {
            const data = await ClickerHeroesAPI.getGuildInfo(uid, pwd);

            const members: ClanMember[] = Object.values(data.guildMembers).map(member => ({
                uid: member.uid,
                highestZone: parseInt(member.highestZone),
                nickname: member.nickname,
                class: parseInt(member.chosenClass),
                level: parseInt(member.classLevel),

                lastRewardTimestamp: member.lastRewardTimestamp,
                lastBonusRewardTimestamp: member.lastBonusRewardTimestamp
            }));

            return {
                name: data.guild.name,
                masterUid: data.guild.guildMasterUid,

                members: members,

                currentRaidLevel: parseInt(data.guild.currentRaidLevel),
                currentNewRaidLevel: data.guild.currentNewRaidLevel,
                newRaidLocked: data.guild.newRaidLocked === 'true',

                autoJoin: data.guild.autoJoin
            } as Clan;
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

    async getClanNewRaid(uid: string, pwd: string, clanName: string) {
        try {
            const data = await ClickerHeroesAPI.getNewRaid(uid, pwd, clanName);
            const raid: ClanNewRaid = {
                level: parseInt(data.raid.level),
                date: data.raid.date,
                scores: [],
                bonusScores: [],
                weakness: data.raid.weakness,
                isSuccessful: data.raid.isSuccessful,
                isBonusAvailable: data.raid.isBonusAvailable,
                isBonusSuccessful: data.raid.isBonusSuccessful
            }

            for(const pair of Object.entries(data.raid.scores)) {
                raid.scores.push({ uid: pair[0], score: pair[1] });
            }
    
            for(const pair of Object.entries(data.raid.bonusScores)) {
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
            const messages: ClanMessage[] = [];
            
            for(const key in data.messages) {
                const split = data.messages[key].split(';', 2);
                messages.push({ timestamp: parseFloat(key), uid: split[0], content: split[1] });
            }

            return messages;
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