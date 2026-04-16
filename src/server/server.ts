import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import Bot from "../bot/client";
import ErrorHandler from './handlers/error.handler';
import UserService from '../services/user.service';
import createGuildRouter from './routes/guild.router';
import GuildController from './controllers/guild.controller';
import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import createUserRouter from './routes/user.router';
import createAuthRouter from './routes/auth.router';
import GuildService from '../services/guild.service';
import ClanService from '../services/clan.service';
import AuthenticateUserMiddleware from './middlewares/authenticate_user.middleware';
import IsInGuildMiddleware from './middlewares/is_in_guild.middleware';
import session from 'express-session';

function createServer(
    bot: Bot,
    userService: UserService,
    guildService: GuildService,
    clanService: ClanService
) {
    const server = express();
    const allowedOrigins = [process.env.FRONTEND_ADDRESS as string];

    server.use(cors({
        origin: allowedOrigins,
        credentials: true
    }));
    server.use(bodyParser.json());
    //server.use(cookieParser());
    server.use(session({
        secret: process.env.TOKEN_SECRET as string,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    }))

    const authController = new AuthController(userService);
    const userController = new UserController(userService);
    const guildController = new GuildController(bot, guildService, clanService);

    const authenticateMiddleware = AuthenticateUserMiddleware(userService);
    const isInGuildMiddleware = IsInGuildMiddleware(userService);

    server.use('/api/auth', createAuthRouter(authController));
    server.use('/api/user', createUserRouter(userController, authenticateMiddleware));
    server.use('/api/guilds', createGuildRouter(guildController, authenticateMiddleware, isInGuildMiddleware));

    server.use(ErrorHandler);

    return server;
}

export default createServer;