import axios from "axios";
import { Router } from "express";

const API_ENDPOINT = "https://discord.com/api/v10";

const AuthRouter = Router();

AuthRouter.get('/', async (req, res) => {
    const code = req.query.code;
    
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(`<script>window.opener.postMessage("${code}", "http://localhost:3000");window.close();</script>`));
});

AuthRouter.post('/login', async (req, res) => {
    const code = req.body.code;
    const params: any = {
        'client_id': process.env.APP_ID,
        'client_secret': process.env.APP_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'http://127.0.0.1:3010/api/auth'
    };

    try {
        const tokenResponse = await axios.post(`${API_ENDPOINT}/oauth2/token`, new URLSearchParams(params));

        req.session.token = tokenResponse.data.access_token;
        console.log(`Access token: ${req.session.token}`);
        res.send({ code: 200 });
    } catch(error) {
        res.send({ code: 301, msg: error });
    }
});

AuthRouter.post('/logout', async (req, res) => {
    req.session.token = '';
    res.send({ code: 200 });
});

export default AuthRouter;