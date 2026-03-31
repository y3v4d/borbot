import { Router, Express, RequestHandler } from "express";
import GuildController from "../controllers/guild.controller";

export default function createGuildRouter(
    controller: GuildController,
    authenticate: RequestHandler,
    isInGuild: RequestHandler,
) {
    const router = Router();

    router.get('/:id', authenticate, isInGuild, controller.guild_get);
    router.post('/:id', authenticate, isInGuild, controller.guild_post);
    router.patch('/:id', authenticate, isInGuild, controller.guild_patch);
    router.delete('/:id', authenticate, isInGuild, controller.guild_delete);

    router.get('/:id/clan/members', authenticate, isInGuild, controller.guild_clan_members_get);

    router.get('/:id/members', authenticate, isInGuild, controller.guild_members_get);
    router.get('/:id/channels', authenticate, isInGuild, controller.guild_channels_get);
    router.get('/:id/roles', authenticate, isInGuild, controller.guild_roles_get);

    router.get('/:id/connected', authenticate, isInGuild, controller.guild_connected_get);
    router.post('/:id/connected', authenticate, isInGuild, controller.guild_connected_post);

    router.get('/:id/schedule', authenticate, isInGuild, controller.guild_schedule_get);
    router.post('/:id/schedule', authenticate, isInGuild, controller.guild_schedule_post);

    return router;
}