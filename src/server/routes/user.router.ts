import { RequestHandler, Router } from "express";
import UserController from "../controllers/user.controller";

export default function createUserRouter(
    controller: UserController,
    authenticate: RequestHandler
) {
    const router = Router();

    router.get('/', authenticate, controller.user_get);
    router.get('/guilds', authenticate, controller.user_guilds_get);

    return router;
}