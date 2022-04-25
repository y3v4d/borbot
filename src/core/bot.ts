import { Client, ClientOptions } from "discord.js";
import { ClanManager } from "../shared/clan";

export default class Bot extends Client {
    readonly clan: ClanManager;

    constructor(options: ClientOptions, uid: string, passwordHash: string) {
        super(options);

        this.clan = new ClanManager(uid, passwordHash);
    }
}