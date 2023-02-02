import { Router } from "express";
import UserController from "../controllers/userController";
import AuthenticateUser from "../middlewares/authenticateUser";

const MeRouter = Router();

MeRouter.get('/', AuthenticateUser, UserController.getUserInformation);
MeRouter.get('/guilds', AuthenticateUser, UserController.getUserGuilds);

export default MeRouter;