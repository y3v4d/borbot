import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from "@discordjs/builders";
import { BaseCommandInteraction } from "discord.js";
import { readFileSync } from "fs";
import Bot from "../core/bot";
import Command from "../core/command";

export const Connected: Command = {
    data: new SlashCommandBuilder()
        .setName("connected")
        .setDescription("List guild members connected to clan accounts")
        .setDefaultPermission(false),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        await client.clan.update();

        const guild = await client.guilds.fetch(process.env.GUILD_ID!)!;
        const userMap = JSON.parse(
            readFileSync('data/userMap.json', { encoding: 'utf-8' })
        ) as { [key: string]: string };

        let all_members = client.clan.getAllMembers();
        let msg = "**Connected users**:\n";
        for(let gid in userMap) {
            msg += (await guild.members.fetch(gid)).nickname;
            msg += ` -> ${client.clan.getMemberByUid(userMap[gid])!.nickname}\n`;

            all_members.splice(all_members.findIndex(o => o.uid === userMap[gid]), 1);
        }

        if(all_members.length > 0) {
            msg += "\n**Disconnected users**:\n";

            for(let member of all_members) {
                msg += `${member.nickname}\n`;
            }
        }

        interaction.followUp(msg);
    }
}