import Command from "./shared/command";
import { TypeScript } from "./commands/typescript";
import { Clan } from "./commands/clan";
import { Connect } from "./commands/connect";
import { Connected } from "./commands/connected";

export const Commands: Command[] = [
    TypeScript,
    Clan,
    Connect,
    Connected
];