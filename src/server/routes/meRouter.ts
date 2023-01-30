import { Router } from "express";
import UserController from "../controllers/userController";
import CheckForToken from "../middlewares/checkForToken";

const MeRouter = Router();

MeRouter.get('/', CheckForToken, UserController.getUserInformation);
MeRouter.get('/guilds', CheckForToken, UserController.getUserGuilds);

export default MeRouter;