import axios from "axios";
import { Router } from "express";
import DC from "../api/discord";

const AuthRouter = Router();

AuthRouter.get('/', async (req, res) => {
    const code = req.query.code;
    
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(`<script>window.opener.postMessage("${code}", "http://localhost:3000");window.close();</script>`));
});

AuthRouter.post('/login', async (req, res) => {
    const clientID = process.env.APP_ID as string;
    const clientSecret = process.env.APP_SECRET as string;
    const clientCode = req.body.code as string;

    try {
        const data = await DC.getAuthToken(clientID, clientSecret, clientCode);

        req.session.token = data.access_token;
        res.send({});
    } catch(error: any) {
        res.status(error.status)
        res.send({ code: error.data.code, message: error.data.message });
    }
});

AuthRouter.post('/logout', async (req, res) => {
    req.session.token = '';
    res.send({});
});

export default AuthRouter;