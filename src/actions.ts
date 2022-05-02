import { AnnounceRaids } from "./actions/announceRaids";
import { UpdateUsers } from "./actions/updateUsers";
import Action from "./core/action";

export const Actions: Action[] = [
    UpdateUsers,
    AnnounceRaids
];