import { Router } from "express";
import GuildController from "../controllers/guild.controller";
import AuthenticateUser from "../middlewares/authenticateUser.middleware";
import IsInGuild from "../middlewares/isInGuild.middleware";

const GuildRouter = Router();

GuildRouter.get('/:id', AuthenticateUser, IsInGuild, GuildController.guild_get);
GuildRouter.post('/:id', AuthenticateUser, IsInGuild, GuildController.guild_post);
GuildRouter.patch('/:id', AuthenticateUser, IsInGuild, GuildController.guild_patch);
GuildRouter.delete('/:id', AuthenticateUser, IsInGuild, GuildController.guild_delete);

GuildRouter.get('/:id/clan/members', AuthenticateUser, IsInGuild, GuildController.guild_clan_members_get);

GuildRouter.get('/:id/members', AuthenticateUser, IsInGuild, GuildController.guild_members_get);
GuildRouter.get('/:id/channels', AuthenticateUser, IsInGuild, GuildController.guild_channels_get);
GuildRouter.get('/:id/roles', AuthenticateUser, IsInGuild, GuildController.guild_roles_get);

GuildRouter.get('/:id/connected', AuthenticateUser, IsInGuild, GuildController.guild_connected_get);
GuildRouter.post('/:id/connected', AuthenticateUser, IsInGuild, GuildController.guild_connected_post);

GuildRouter.get('/:id/schedule', AuthenticateUser, IsInGuild, GuildController.guild_schedule_get);
GuildRouter.post('/:id/schedule', AuthenticateUser, IsInGuild, GuildController.guild_schedule_post);

export default GuildRouter;