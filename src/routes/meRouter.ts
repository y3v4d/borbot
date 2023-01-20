import { Router } from "express";
import DiscordAPI from "../api/discord";
import { getGuildIconURL, isAdmin } from "../shared/utils";

const MeRouter = Router();
MeRouter.get('/', async (req, res) => {
    const token = req.headers.authorization;
    if(!token) {
        res.status(401).send({ code: 0, message: "Authorization required" });
        return;
    }

    try {
        const data = await DiscordAPI.getUserInformation(token);
        
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
    const token = req.headers.authorization;
    if(!token) {
        res.status(401).send({ code: 0, message: "Authorization required" });
        return;
    }

    const call = async () => {
        try {
            const data = await DiscordAPI.getUserGuilds(token);

            const items: any[] = [];
            for(const guild of data) {
                items.push({ 
                    name: guild.name, 
                    id: guild.id, 
                    icon: getGuildIconURL(guild), 
                    permissions: guild.permissions,
                    isAdmin: isAdmin(guild.permissions)
                });
            }

            res.send(items);
        } catch(error: any) {
            if(error.status == 429) {
                const retry_after = error.data.retry_after;
                console.log(`Rate limit hit, retrying after ${retry_after}`);

                setTimeout(call, retry_after * 1000);
            } else {
                res.status(error.status);
                res.send({ code: error.data.code, message: error.data.message });
            }
        }
    }

    call();
});

export default MeRouter;