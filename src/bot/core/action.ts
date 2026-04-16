import { IGuild } from "../../models/guild";
import Bot from "../client";

export type ActionExecuter = (client: Bot, guild: IGuild) => Promise<void>;

export default interface Action {
    name: string;
    timeout: number;

    startOnInit: boolean;
    repeat: boolean;
    
    run: ActionExecuter
}