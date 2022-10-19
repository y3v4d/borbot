import axios from "axios";
import { Router } from "express";
import { getGuildIconURL } from "../shared/utils";

declare module 'express-session' {
    interface SessionData {
        token: string;
    }
}

const API_ENDPOINT = "https://discord.com/api/v10";

function testToken(token?: string) {
    return token;
}

const MainRouter = Router();

MainRouter.get('/guilds', async (req, res) => {
    const token = req.session.token;

    const tryThis = async () => {
        try {
            const guildsResponse = await axios.get(`${API_ENDPOINT}/users/@me/guilds`, {
                params: { limit: 200 },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            const items: any[] = [];
            for(const guild of guildsResponse.data) {
                items.push({ name: guild.name, id: guild.id, icon: getGuildIconURL(guild), permissions: guild.permissions });
            }
            console.log('sending items');
    
            res.send({ code: 200, items: items });
        } catch(error: any) {
            if(error.response.status == 429) {
                setTimeout(async () => await tryThis(), 1000); 
            } else {
                console.error(error);
                res.status(parseInt(error.response.status));
                res.send({ code: error.response.status, msg: error.response.statusText });
            }
        }
    }

    await tryThis();

    
});

MainRouter.get('/auth', async (req, res) => {
    const code = req.query.code;
    
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(`<script>window.opener.postMessage("${code}", "http://localhost:3000");window.close();</script>`));
});

MainRouter.post('/auth', async (req, res) => {
    const code = req.body.code;
    const params: any = {
        'client_id': process.env.APP_ID,
        'client_secret': process.env.APP_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'http://127.0.0.1:3010/api/auth'
    };

    try {
        const tokenResponse = await axios.post(`${API_ENDPOINT}/oauth2/token`, new URLSearchParams(params));

        req.session.token = tokenResponse.data.access_token;
        await req.session.save();
        console.log(`Access token: ${req.session.token}`);
        res.send({ code: 200 });
    } catch(error) {
        res.send({ code: 301, msg: error });
    }
});

MainRouter.post('/deauth', async (req, res) => {
    req.session.token = '';
    res.send({ code: 200 });
});

MainRouter.get('/me', async (req, res) => {
    const token = req.session.token;
    console.log(`Token: ${token}`);

    try {
        const meResponse = await axios.get(`${API_ENDPOINT}/oauth2/@me`, { headers: { 'Authorization': `Bearer ${token}` }});
        console.log(meResponse.data);
        
        res.send({ 
            code: 200, 
            user: {
                username: meResponse.data.user.username,
                avatar: meResponse.data.user.avatar,
                discriminator: meResponse.data.user.discriminator
            } 
        });
    } catch(error) {
        res.send({ code: 301 });
    }
});

export default MainRouter;