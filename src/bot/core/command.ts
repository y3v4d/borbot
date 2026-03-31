import { CommandInteraction } from "discord.js";
import Bot from "../client";

export default interface Command {
    data: any,
    run: (client: Bot, interaction: CommandInteraction) => Promise<void>
}