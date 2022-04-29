import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import Bot from "../core/bot";
import Command from "../core/command";
import MemberModel, { IMember } from "../models/member";

export const Connect: Command = {
    data: new SlashCommandBuilder()
        .setName('connect')
        .setDescription('Connect discord user to the clicker heroes profile!')
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

        const clan_name = interaction.options.get('clan_name')!.value! as string;
        const guild_user = interaction.options.get('guild_user')!.user!;
        if(guild_user.bot) {
            await interaction.followUp("Did you just try to assign something to the mighty Borb?!");
            return;
        }
        
        await client.clan.update();
        const clan_member = client.clan.getMemberByName(clan_name);
        if(!clan_member) {
            await interaction.followUp(`Couldn't find user with name ${clan_name} in the clan...`);
            return;
        }

        const schema: IMember = {
            clan_uid: clan_member.uid,

            guild_id: interaction.guildId!,
            guild_uid: guild_user.id
        };

        if(await MemberModel.exists({ clan_uid: clan_member.uid })) {
            await interaction.followUp(`${clan_name} is already connected!`);
            return;
        }

        await (new MemberModel(schema)).save();
        await interaction.followUp(`Assigned ${guild_user} to ${clan_name}!`);
        //await UpdateUsers.run(client); too expensive
    }
}