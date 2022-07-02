import Command from "./core/command";
import { TypeScript } from "./commands/typescript";
import { Clan } from "./commands/clan";
import { Connect } from "./commands/connect";
import { Connected } from "./commands/connected";
import { Schedule } from "./commands/schedule";
import { Profile } from "./commands/profile";
import { Setup } from "./commands/setup";
import { MakeSchedule } from "./commands/make-schedule";
import { SetupSchedule } from "./commands/setup-schedule";
import { RemoveSchedule } from "./commands/remove-schedule";
import { Disconnect } from "./commands/disconnect";

export const Commands: Command[] = [
    TypeScript,
    Clan,
    Connect,
    Disconnect,
    Connected,
    Schedule,
    Profile,
    MakeSchedule,
    Setup,
    SetupSchedule,
    RemoveSchedule
];