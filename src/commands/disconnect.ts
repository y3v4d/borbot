import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import logger, { LoggerType } from "../shared/logger";
import Bot from "../core/bot";
import Command from "../core/command";
import MemberModel, { IMember } from "../models/member";

export const Disconnect: Command = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnect discord user from the clicker heroes profile!')
        .setDefaultPermission(false)
        .addUserOption(option => option
            .setName('guild_user')
            .setDescription('The discord user to disconnect')
            .setRequired(true)
        ),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const guild_user = interaction.options.get('guild_user')!.user!;
        if(guild_user.bot) {
            await interaction.followUp("Did you just try to assign something to the mighty Borb?!");
            return;
        }

        const dbMember = await MemberModel.findOne({ guild_uid: guild_user.id });
        if(!dbMember) {
            const msg = `Couldn't find member with guild uid: ${guild_user.id}`;

            logger(`/disconnect ${msg}`, LoggerType.ERROR);
            await interaction.followUp(msg);
            return;
        }

        await dbMember.deleteOne();
        await interaction.followUp({
            content: `Removed guild user ${guild_user.id} from members`
        });
    }
}