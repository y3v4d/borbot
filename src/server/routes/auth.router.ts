import { Router } from "express";
import AuthController from "../controllers/auth.controller";

export default function createAuthRouter(controller: AuthController) {
    const router = Router();

    router.get('/', controller.discord_auth_callback);
    router.get('/back', controller.discord_auth_bot_callback);
    router.post('/login', controller.auth_login);
    router.post('/logout', controller.auth_logout);

    return router;
}