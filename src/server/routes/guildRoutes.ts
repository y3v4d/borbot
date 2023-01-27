import { Router } from "express";
import GuildController from "../controllers/guildController";
import IsInGuild from "../middlewares/isInGuild";

const GuildRouter = Router();

GuildRouter.get('/:id', IsInGuild, GuildController.getGuildInformation);

GuildRouter.post('/:id/setup', IsInGuild, GuildController.setup);
GuildRouter.post('/:id/unsetup', IsInGuild, GuildController.unsetup);

GuildRouter.get('/:id/members', IsInGuild, GuildController.getGuildMembers);
GuildRouter.get('/:id/channels', IsInGuild, GuildController.getGuildChannels);

GuildRouter.get('/:id/connected', IsInGuild, GuildController.getConnectedUsers);
GuildRouter.post('/:id/connected', IsInGuild, GuildController.postConnectedUsers);

GuildRouter.get('/:id/schedule', IsInGuild, GuildController.getSchedule);
GuildRouter.post('/:id/schedule', IsInGuild, GuildController.postSchedule);

export default GuildRouter;