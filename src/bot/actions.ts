import { AnnounceRaids } from "./actions/announce-raids.action";
import { RemindClaim } from "./actions/remind-claim.action";
import SyncClanUsersAction from "./actions/sync-clan-users.action";
import SyncDiscordLinksAction from "./actions/sync-discord-links.action";
import { UpdateChat } from "./actions/update-chat.action";
import { UpdateSchedule } from "./actions/update-schedule.action";
import { UpdateUsers } from "./actions/update-users.action";
import Action from "./core/action";

export const Actions: Action[] = [
    SyncClanUsersAction,
    SyncDiscordLinksAction,
    UpdateUsers,
    AnnounceRaids,
    UpdateChat,
    RemindClaim,
    UpdateSchedule
];