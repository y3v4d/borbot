import { Request, Response } from "express";
import DiscordAPI from "../../api/discord";
import UserService from "../../services/user.service";
import Code from "../../shared/code";
import logger, { LoggerType } from "../../shared/logger";
import { validate_str, validateParams } from "../../shared/utils";

class AuthController {
    constructor(
        readonly userService: UserService
    ) {}

    auth_login = async (req: Request, res: Response) => {
        const clientID = process.env.APP_ID as string;
        const clientSecret = process.env.APP_SECRET as string;
    
        try {
            const params = await validateParams(req.body, {
                code: { type: validate_str }
            });
            
            const oauth = await DiscordAPI.getAuthToken(clientID, clientSecret, params.code, process.env.FRONTEND_ADDRESS! + "/auth_callback");
            const user = await this.userService.ensureUserExistsSynced(oauth.access_token);

            (req.session as any).data = {
                uid: user.id,

                discord_token: oauth.access_token,
                discord_refresh_token: oauth.refresh_token,
                discord_token_expires: Date.now() + oauth.expires_in * 1000
            };

            res.send({ code: Code.OK, msg: "OK" });
        } catch(error: any) {
            logger(`Failed to login user`, LoggerType.ERROR);
            console.error(error);
            
            res.status(error.status || 500);
            res.send({ code: error.data?.code || Code.INTERNAL_SERVER_ERROR, message: error.data?.message || error.message });
        }
    }
    
    auth_logout = async (req: Request, res: Response) => {
        req.session.destroy((error) => {
            if(error) {
                logger(`Failed to destroy session for user ${(req.session as any).data?.uid}: ${error.message}`, LoggerType.ERROR);
                res.status(500).send({ code: Code.INTERNAL_SERVER_ERROR, message: "Failed to logout" });

                return;
            }

            res.send({ code: Code.OK, msg: "OK" });
        });
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

