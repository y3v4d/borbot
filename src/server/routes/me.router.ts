import { Router } from "express";
import UserController from "../controllers/user.controller";
import AuthenticateUser from "../middlewares/authenticateUser.middleware";

const MeRouter = Router();

MeRouter.get('/', AuthenticateUser, UserController.getUserInformation);
MeRouter.get('/guilds', AuthenticateUser, UserController.getUserGuilds);

export default MeRouter;