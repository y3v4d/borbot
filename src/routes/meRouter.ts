import axios from "axios";
import { Router } from "express";
import { getGuildIconURL } from "../shared/utils";

const API_ENDPOINT = "https://discord.com/api/v10";

const MeRouter = Router();

MeRouter.get('/', async (req, res) => {
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

MeRouter.get('/guilds', async (req, res) => {
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

export default MeRouter;