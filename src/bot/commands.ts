import Command from "./core/command";
import { Clan } from "./commands/clan";
import { Profile } from "./commands/profile";

export const Commands: Command[] = [
    Clan,
    Profile
];