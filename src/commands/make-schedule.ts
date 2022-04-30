import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommandInteraction, GuildMember } from "discord.js";
import ScheduleModel from "../models/schedule";
import Bot from "../core/bot";
import Command from "../core/command";
import GuildModel from "../models/guild";
import MemberModel from "../models/member";

export const MakeSchedule: Command = {
    data: new SlashCommandBuilder()
        .setName("make-schedule")
        .setDescription("Assign people to schedule.")
        .setDefaultPermission(false)
        .addIntegerOption(input => input
            .setName("day")
            .setDescription("Day of the schedule (1-10)")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true))
        .addStringOption(input => input
            .setName("clan_user")
            .setDescription("Clan user name that will be assigned to that day.")
            .setRequired(true)),

    run: async function(client: Bot, interaction: BaseCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        await client.clan.update();

        const clan_user = interaction.options.get('clan_user', true)!.value! as string;
        const day = interaction.options.get('day', true)!.value! as number;

        const dbGuild = await GuildModel.findOne({ guild_id: interaction.guildId! });
        if(!dbGuild) {
            await interaction.followUp("Guild wasn't setuped!");
            return;
        }

        if(!dbGuild.schedule) {
            await interaction.followUp("Schedule wasn't setuped!");
            return;
        }
        const dbSchedule = (await ScheduleModel.findById(dbGuild.schedule!))!;
  
        const clanMember = client.clan.getMemberByName(clan_user);
        if(!clanMember) {
            await interaction.followUp(`Clan member with ${clan_user} name doesn't exists!`);
            return;
        }

        const dbMember = await MemberModel.findOne({ clan_uid: clanMember.uid });
        if(!dbMember) {
            await interaction.followUp(`Clan member is not connected to any discord user!`);
            return;
        }

        const dbEntry = dbSchedule.map.find(o => o.index === day);
        if(!dbEntry) {
            dbSchedule.map.push({
                member: dbMember._id,
                index: day
            });
        } else {
            dbEntry.member = dbMember.id;
        }
        await dbSchedule.save();
        await interaction.followUp(`Assigned <@${dbMember.guild_uid}> to ${day} day of the cycle!`);
    }
}