import { Router } from "express";
import UserController from "../controllers/user.controller";
import AuthenticateUser from "../middlewares/authenticateUser.middleware";

const UserRouter = Router();

UserRouter.get('/', AuthenticateUser, UserController.user_get);
UserRouter.get('/guilds', AuthenticateUser, UserController.user_guilds_get);

export default UserRouter;