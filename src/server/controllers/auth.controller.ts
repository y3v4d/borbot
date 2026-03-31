import { Request, Response } from "express";
import DiscordAPI from "../../api/discord";
import UserService from "../../services/user.service";
import Code from "../../shared/code";
import { generateAccessToken } from "../../shared/utils";

class AuthController {
    constructor(
        readonly userService: UserService
    ) {}

    auth_login = async (req: Request, res: Response) => {
        const clientID = process.env.APP_ID as string;
        const clientSecret = process.env.APP_SECRET as string;
        const clientCode = req.body.code as string;
    
        try {
            const oauth = await DiscordAPI.getAuthToken(clientID, clientSecret, clientCode, process.env.FRONTEND_ADDRESS! + "/auth_callback");
            const user = await DiscordAPI.getUserInformation(oauth.access_token);

            console.log(user);
            console.log(oauth);

            await this.userService.createOrUpdateUser({ id: user.id, token: oauth.access_token });

            const jwtToken = generateAccessToken(user.id);
            res.cookie('token', jwtToken).send({ code: Code.OK, msg: "OK" });
        } catch(error: any) {
            console.log(error);
            res.status(error.status || 500);
            res.send({ code: error.data?.code || Code.INTERNAL_SERVER_ERROR, message: error.data?.message || error.message });
        }
    }
    
    auth_logout = async (req: Request, res: Response) => {
        res.clearCookie('token').send({ code: Code.OK, msg: "OK" });
    }

    discord_auth_callback = (req: Request, res: Response) => {
        const code = req.query.code;
        
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`<script>window.opener.postMessage("${code}", "${process.env.FRONTEND_ADDRESS}");window.close();</script>`));
    }
    
    discord_auth_bot_callback = (req: Request, res: Response) => {
        res.set('Content-Type', 'text/html');
        res.send(Buffer.from(`<script>window.opener.postMessage("OK", "${process.env.FRONTEND_ADDRESS}");window.close();</script>`));
    }
}

export default AuthController;

