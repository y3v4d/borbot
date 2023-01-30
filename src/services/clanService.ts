import ClickerHeroesAPI from "../api/clickerheroes";
import Code from "../shared/code";

class ClanService {
    async getClanMembers(uid: string, password_hash: string) {
        try {
            const data = await ClickerHeroesAPI.getGuildInfo(uid, password_hash);
            const members = Object.values(data.guildMembers).map(member => ({
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
}

export default ClanService;