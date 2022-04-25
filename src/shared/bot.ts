import { Client, ClientOptions } from "discord.js";
import { Clan } from "./clan";

export default class Bot extends Client {
    readonly clan: Clan;

    constructor(options: ClientOptions, uid: string, passwordHash: string) {
        super(options);

        this.clan = new Clan(uid, passwordHash);
    }
}