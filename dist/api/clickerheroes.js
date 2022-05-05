"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const https = tslib_1.__importStar(require("https"));
var CH;
(function (CH) {
    function post(request, params) {
        const options = {
            hostname: 'ClickerHeroes-SavedGames3-747864888.us-east-1.elb.amazonaws.com',
            path: `/clans/${request}.php`,
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            rejectUnauthorized: false
        };
        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let body = '';
                res.on('data', d => {
                    body += d;
                });
                res.on('end', () => {
                    body = body.replaceAll('\\', '/');
                    resolve(JSON.parse(body));
                });
            });
            req.on('error', error => reject(error));
            req.write(new URLSearchParams(params).toString());
            req.end();
        });
    }
    async function getGuildInfo(uid, passwordHash) {
        const data = await post('getGuildInfo', { uid: uid, passwordHash: passwordHash });
        if (!data.success)
            throw new Error(`getGuildInfo failed: ${data.reason}`);
        return data.result;
    }
    CH.getGuildInfo = getGuildInfo;
    async function getNewRaid(uid, passwordHash, guildName) {
        const data = await post('getNewRaid', { uid: uid, passwordHash: passwordHash, guildName: guildName });
        return data.result.raid;
    }
    CH.getNewRaid = getNewRaid;
})(CH || (CH = {}));
exports.default = CH;
