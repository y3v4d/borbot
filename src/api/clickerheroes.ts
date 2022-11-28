import * as https from 'https';

namespace CH {
    function post(request: string, params: any) {
        const options: https.RequestOptions = {
            hostname: 'ClickerHeroes-SavedGames3-747864888.us-east-1.elb.amazonaws.com',
            path: `/clans/${request}.php`,
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            rejectUnauthorized: false
        }

        return new Promise<any>((resolve, reject) => {
            const req = https.request(options, res => {
                let body = '';
                res.on('data', d => {
                    body += d;
                });

                res.on('end', () => {
                    if(request !== "getGuildMessages") body = body.replaceAll('\\', '/');
                    resolve(JSON.parse(body));
                });
            });

            req.on('error', error => reject(error));
            req.write(new URLSearchParams(params).toString());
            req.end();
        });
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

    export interface NewRaidResult {
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

    interface RawGuildMessages {
        [key: string]: string
    }

    export interface GuildMessage {
        uid: string,
        content: string,
        timestamp: number
    }

    export interface GuildMessagesResult {
        guildName: string,
        messages: GuildMessage[]
    }

    export async function getGuildInfo(uid: string, passwordHash: string) {
        const data = await post('getGuildInfo', { uid: uid, passwordHash: passwordHash });

        if(!data.success) throw new Error(`getGuildInfo failed: ${data.reason}`);
        return data.result as GuildInfoResult;
    }

    export async function getNewRaid(uid: string, passwordHash: string, guildName: string) {
        const data = await post('getNewRaid', { uid: uid, passwordHash: passwordHash, guildName: guildName });
        return data.result.raid as NewRaidResult;
    }

    export async function getGuildMessages(uid: string, passwordHash: string, guildName: string) {
        const data = await post('getGuildMessages', { uid: uid, passwordHash: passwordHash, guildName: guildName, timestamp: (Date.now() / 1000) });
        const messages = data.result.messages as RawGuildMessages;

        const result: GuildMessagesResult = {
            guildName: data.result.guildName,
            messages: []
        };

        for(const key in messages) {
            const split = messages[key].split(';', 2);
            result.messages.push({ timestamp: parseFloat(key), uid: split[0], content: split[1] });
        }

        return result;
    }
}

export default CH;