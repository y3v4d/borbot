import { Client } from "discord.js";

export default interface Action {
    timeout: number;

    startOnInit: boolean;
    repeat: boolean;
    
    run: (client: Client) => Promise<void>;
}