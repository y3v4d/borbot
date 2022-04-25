import Command from "./core/command";
import { TypeScript } from "./commands/typescript";
import { Clan } from "./commands/clan";
import { Connect } from "./commands/connect";
import { Connected } from "./commands/connected";
import { MakeSchedule } from "./commands/make-schedule";
import { Schedule } from "./commands/schedule";

export const Commands: Command[] = [
    TypeScript,
    Clan,
    Connect,
    Connected,
    Schedule
];