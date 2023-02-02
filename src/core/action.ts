import { IGuild } from "../models/guild";
import Bot from "./bot";

export type ActionExecuter = (client: Bot, guild: IGuild) => Promise<void>;

export default interface Action {
    timeout: number;

    startOnInit: boolean;
    repeat: boolean;
    
    run: ActionExecuter
}