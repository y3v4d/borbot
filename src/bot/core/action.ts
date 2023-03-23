import { HydratedDocument } from "mongoose";
import { IGuild } from "../../models/guild";
import Bot from "../client";

export type ActionExecuter = (client: Bot, guild: HydratedDocument<IGuild>) => Promise<void>;

export default interface Action {
    timeout: number;

    startOnInit: boolean;
    repeat: boolean;
    
    run: ActionExecuter
}