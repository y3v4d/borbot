import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import GuildModel, { IGuild } from "../models/guild";
import { ClanManager } from "../shared/clan";
import Bot from "../core/bot";
import Command from "../core/command";

export const Setup: Command = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup the Mighty Borb!")
        .addStringOption(input => input
            .setName('user_uid')
            .setDescription('User UID used to connect to the clicker heroes server.')
            .setRequired(true))
        .addStringOption(input => input
            .setName('user_hash')
            .setDescription('User password hash to connect to the clicker heroes server.')
            .setRequired(true)),

        run: async function(client: Bot, interaction: BaseCommandInteraction) {
            if(await GuildModel.exists({ guild_id: interaction.guildId! })) {
                await interaction.reply("This guild was already setuped!");
                return;
            }

            const user_uid = interaction.options.get('user_uid')!.value! as string;
            const user_hash = interaction.options.get('user_hash')!.value! as string;

            if(!(await ClanManager.test(user_uid, user_hash))) {
                await interaction.reply("The user with specified UID and password cannot connect to servers... Double check the values!");
                return;
            }
            
            const schema: IGuild = {
                guild_id: interaction.guildId!,
                user_uid: user_uid,
                password_hash: user_hash
            };

            await (new GuildModel(schema)).save();
            await interaction.reply("Successfully setuped the guild!");
        }
}