import { Router } from "express";
import GuildController from "../controllers/guild.controller";
import IsInGuild from "../middlewares/isInGuild.middleware";

const GuildRouter = Router();

GuildRouter.get('/:id', IsInGuild, GuildController.guild_get);
GuildRouter.post('/:id', IsInGuild, GuildController.guild_post);
GuildRouter.delete('/:id', IsInGuild, GuildController.guild_delete);

GuildRouter.get('/:id/clan/members', IsInGuild, GuildController.guild_clan_members_get);

GuildRouter.get('/:id/members', IsInGuild, GuildController.guild_members_get);
GuildRouter.get('/:id/channels', IsInGuild, GuildController.guild_channels_get);
GuildRouter.get('/:id/roles', IsInGuild, GuildController.guild_roles_get);

GuildRouter.get('/:id/connected', IsInGuild, GuildController.guild_connected_get);
GuildRouter.post('/:id/connected', IsInGuild, GuildController.guild_connected_post);

GuildRouter.get('/:id/schedule', IsInGuild, GuildController.guild_schedule_get);
GuildRouter.post('/:id/schedule', IsInGuild, GuildController.guild_schedule_post);

export default GuildRouter;