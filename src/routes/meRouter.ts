import axios from "axios";
import { Router } from "express";
import DC from "../api/discord";
import { getGuildIconURL } from "../shared/utils";

const MeRouter = Router();

MeRouter.get('/', async (req, res) => {
    const token = req.session.token as string;

    try {
        const data = await DC.getUserInformation(token);
        
        res.send({
            id: data.id,
            username: data.username,
            avatar: data.avatar,
            discriminator: data.discriminator
        });
    } catch(error: any) {
        res.status(error.status);
        res.send({ code: error.data.code, message: error.data.message });
    }
});

MeRouter.get('/guilds', async (req, res) => {
    const token = req.session.token as string;

    const tryThis = async () => {
        try {
            const data = await DC.getUserGuilds(token);
    
            const items: any[] = [];
            for(const guild of data) {
                items.push({ name: guild.name, id: guild.id, icon: getGuildIconURL(guild), permissions: guild.permissions });
            }
    
            res.send(items);
        } catch(error: any) {
            if(error.status == 429) {
                setTimeout(async () => await tryThis(), 1000); 
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, message: error.data.message });
            }
        }
    }

    await tryThis();
});

export default MeRouter;