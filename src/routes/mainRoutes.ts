import axios from "axios";
import { Router } from "express";
import { getGuildIconURL } from "../shared/utils";

const API_ENDPOINT = "https://discord.com/api/v10";

const MainRouter = Router();

MainRouter.get('/guilds', (req, res) => {
    axios({
        url: `${API_ENDPOINT}/users/@me/guilds`,
        method: 'get',
        params: { limit: 100 },
        headers: {
            'Authorization': `Bot ${process.env.TOKEN}`
        }
    }).then(response => {
        const items: any[] = [];
        for(const guild of response.data) {
            items.push({ name: guild.name, id: guild.id, icon: getGuildIconURL(guild) });
        }
        res.send({ code: 200, items: items });
    }).catch(error => {
        res.send({ code: 201, msg: `Couldn't fetch.` });
    });
});

export default MainRouter;