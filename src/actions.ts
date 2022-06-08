import { AnnounceRaids } from "./actions/announceRaids";
import { RemindClaim } from "./actions/remindClaim";
import { UpdateChat } from "./actions/updateChat";
import { UpdateUsers } from "./actions/updateUsers";
import Action from "./core/action";

export const Actions: Action[] = [
    UpdateUsers,
    AnnounceRaids,
    UpdateChat,
    RemindClaim
];