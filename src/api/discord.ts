import https from 'https';

namespace DC {
    export function request(path: string, params: any = {}) {
        const options: https.RequestOptions = {
            hostname: "discord.com",
            path: `/api/v10/${path}`,
            method: 'GET',
            headers: {
                'Authorization': `Bot ${process.env.TOKEN!}`
            }
        };

        return new Promise<any>((resolve, reject) => {
            const req = https.request(options, res => {
                let body = '';
                res.on('data', d => {
                    body += d;
                });

                res.on('end', () => {
                    resolve(JSON.parse(body));
                });
            });

            req.on('error', error => reject(error));
            req.write(new URLSearchParams(params).toString());
            req.end();
        })
    }
}

export default DC;