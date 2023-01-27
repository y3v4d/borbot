import { Request, Response } from "express";
import DiscordAPI from "../../api/discord";

const AuthController = {
    login: async function(req: Request, res: Response) {
        const clientID = process.env.APP_ID as string;
        const clientSecret = process.env.APP_SECRET as string;
        const clientCode = req.body.code as string;
    
        try {
            const data = await DiscordAPI.getAuthToken(clientID, clientSecret, clientCode);
    
            res.cookie('token', data.access_token).send({ code: 0, msg: "OK" });
        } catch(error: any) {
            res.status(error.status)
            res.send({ code: error.data.code, message: error.data.message });
        }
    },
    
    logout: function(req: Request, res: Response) {
        res.clearCookie('token').send({ msg: "OK" });
    },

    discord_auth_callback: function(req: Request, res: Response) {
        const code = req.query.code;
        
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`<script>window.opener.postMessage("${code}", "http://localhost:3000");window.close();</script>`));
    },
    
    discord_auth_bot_callback: function(req: Request, res: Response) {
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`<script>window.opener.postMessage("OK", "http://localhost:3000");window.close();</script>`));
    },
}

export default AuthController;

