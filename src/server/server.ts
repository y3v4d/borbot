import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import Bot from "../core/bot";
import AuthRouter from './routes/auth.router';
import MeRouter from './routes/me.router';
import GuildRouter from './routes/guild.router';
import ErrorHandler from './handlers/error.handler';

function server(client: Bot) {
    const server = express();

    server.set('bot', client);

    server.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
    server.use(bodyParser.json());
    server.use(cookieParser());

    server.use('/api/auth', AuthRouter);
    server.use('/api/me', MeRouter);
    server.use('/api/guilds', GuildRouter);

    server.use(ErrorHandler);

    return server;
}

export default server;