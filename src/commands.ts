import Command from "./core/command";
import { TypeScript } from "./commands/typescript";
import { Clan } from "./commands/clan";
import { Connect } from "./commands/connect";
import { Connected } from "./commands/connected";
import { Schedule } from "./commands/schedule";
import { Setup } from "./commands/setup";
import { MakeSchedule } from "./commands/make-schedule";
import { SetupSchedule } from "./commands/setup-schedule";

export const Commands: Command[] = [
    TypeScript,
    Clan,
    Connect,
    Connected,
    Schedule,
    MakeSchedule,
    Setup,
    SetupSchedule
];