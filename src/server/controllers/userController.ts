import { Request, Response } from "express";
import DiscordAPI from "../../api/discord";
import UserService from "../../services/userService";

const UserController = {
    getUserInformation: async function(req: Request, res: Response) {
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
    },
    
    getUserGuilds: async function (req: Request, res: Response) {
        const token = req.headers.authorization;
        if(!token) {
            res.status(401).send({ code: 0, message: "Authorization required" });
            return;
        }

        try {
            const guilds = await UserService.getUserGuilds(token);

            res.send(guilds);
        } catch(error: any) {
            res.status(error.status);
            res.send({ code: error.data.code, message: error.data.message });
        }
    }
}

export default UserController;