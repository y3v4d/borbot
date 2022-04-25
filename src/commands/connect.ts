import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import Bot from "../shared/bot";
import CH from "../api/clickerheroes";
import Command from "../shared/command";

export const Connect: Command = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect your discord profile to clan profile!')
        .setDefaultPermission(false)
        .addUserOption(option => option
            .setName('guild_user')
            .setDescription('The discord user to connect')
            .setRequired(true)
        )
        .addStringOption(input => input
            .setName('clan_name')
            .setDescription('Clicker Heroes name')
            .setRequired(true)
        ),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        await client.clan.update();

        const buffer = readFileSync("data/userMap.json", { encoding: 'utf-8', });
        const map = JSON.parse(buffer) as { [key: string]: string };

        const clan_name = interaction.options.get('clan_name')!.value! as string;
        const guild_user = interaction.options.get('guild_user')!.user!;

        if(guild_user.bot) {
            interaction.followUp("Did you just try to assign something to the mighty Borb?!");

            return;
        }

        const clan_member = client.clan.getMemberByName(clan_name);
        if(!clan_member) {
            interaction.followUp(`Couldn't find user with name ${clan_name} in the clan...`);

            return;
        }

        map[guild_user.id] = clan_member.uid;
        writeFileSync("data/userMap.json", JSON.stringify(map), { encoding: 'utf-8' });
        interaction.followUp(`Assigned ${guild_user.username} to ${clan_name}!`);
    }
}