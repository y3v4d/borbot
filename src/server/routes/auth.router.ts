import { Router } from "express";
import AuthController from "../controllers/auth.controller";

const AuthRouter = Router();

AuthRouter.get('/', AuthController.discord_auth_callback);
AuthRouter.get('/back', AuthController.discord_auth_bot_callback);
AuthRouter.post('/login', AuthController.auth_login);
AuthRouter.post('/logout', AuthController.auth_logout);

export default AuthRouter;