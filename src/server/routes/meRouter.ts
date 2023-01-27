import { Router } from "express";
import UserController from "../controllers/userController";

const MeRouter = Router();

MeRouter.get('/', UserController.getUserInformation);
MeRouter.get('/guilds', UserController.getUserGuilds);

export default MeRouter;