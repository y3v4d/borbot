import { Router, RequestHandler } from "express";
import GuildController from "../controllers/guild.controller";

export default function createGuildRouter(
    controller: GuildController,
    authenticate: RequestHandler,
    isInGuild: RequestHandler,
) {
    const router = Router();

    router.get('/:id', authenticate, isInGuild, controller.guild_get);
    router.post('/:id', authenticate, isInGuild, controller.guild_post);
    router.delete('/:id', authenticate, isInGuild, controller.guild_delete);

    router.patch('/:id/raid', authenticate, isInGuild, controller.guild_raid_patch);
    router.delete('/:id/raid', authenticate, isInGuild, controller.guild_raid_delete);

    router.patch('/:id/remind', authenticate, isInGuild, controller.guild_remind_patch);
    router.delete('/:id/remind', authenticate, isInGuild, controller.guild_remind_delete);

    router.patch('/:id/chat', authenticate, isInGuild, controller.guild_chat_patch);
    router.delete('/:id/chat', authenticate, isInGuild, controller.guild_chat_delete);

    router.patch('/:id/milestone', authenticate, isInGuild, controller.guild_milestone_patch);
    router.delete('/:id/milestone', authenticate, isInGuild, controller.guild_milestone_delete);

    router.patch('/:id/schedule', authenticate, isInGuild, controller.guild_schedule_patch);
    router.delete('/:id/schedule', authenticate, isInGuild, controller.guild_schedule_delete);

    router.get('/:id/discord/channels', authenticate, isInGuild, controller.discord_channels_get);
    router.get('/:id/discord/roles', authenticate, isInGuild, controller.discord_roles_get);
    router.get('/:id/discord/members', authenticate, isInGuild, controller.discord_members_list);
    router.get('/:id/discord/members/search', authenticate, isInGuild, controller.discord_members_search);

    router.get('/:id/members', authenticate, isInGuild, controller.guild_members_get);
    router.patch('/:id/member-link', authenticate, isInGuild, controller.guild_member_link_patch);

    return router;
}