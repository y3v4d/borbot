import Command from "./core/command";
import { TypeScript } from "./commands/typescript";
import { Clan } from "./commands/clan";
import { Profile } from "./commands/profile";

export const Commands: Command[] = [
    TypeScript,
    Clan,
    Profile
];