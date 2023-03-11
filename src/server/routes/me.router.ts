import { Router } from "express";
import UserController from "../controllers/user.controller";
import AuthenticateUser from "../middlewares/authenticateUser.middleware";

const MeRouter = Router();

MeRouter.get('/', AuthenticateUser, UserController.user_information_get);
MeRouter.get('/guilds', AuthenticateUser, UserController.user_guilds_get);

export default MeRouter;