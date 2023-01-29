import { Request, Response } from "express";
import DiscordAPI from "../../api/discord";
import { getGuildIconURL, isAdmin } from "../../shared/utils";
import UserService from "../services/userService";

const UserController = {
    getUserInformation: async function(req: Request, res: Response) {
        const token = req.headers.authorization;
        if(!token) {
            res.status(401).send({ code: 0, message: "Authorization required" });
            return;
        }
    
        try {
            const user = await UserService.fetchUser(token);
            
            res.send({
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                discriminator: user.discriminator
            });
        } catch(error: any) {
            res.status(error.status);
            res.send({ code: error.data.code, message: error.data.message });
        }
    },
    
    getUserGuilds: async function (req: Request, res: Response) {
        const token = req.headers.authorization;
        if(!token) {
            res.status(401).send({ code: 0, message: "Authorization required" });
            return;
        }
    
        const call = async () => {
            try {
                const user = await UserService.fetchUser(token);
                const guilds = await user.fetchGuilds();
    
                res.send(guilds);
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
    }
}

export default UserController;