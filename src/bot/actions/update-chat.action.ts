import { ChannelType, Guild } from "discord.js";
import Bot from "../client";
import Action from "../core/action";
import { IGuild } from "../../models/types/guild.types";
import logger, { LoggerType } from "../../shared/logger";
import GuildService from "../../services/guild.service";
import { dateToString } from "../../shared/utils";

export const UpdateChat: Action = {
    name: "update-chat",
    timeout: 1,
    startOnInit: true,
    repeat: true,

    run: async function(bot: Bot, guild: IGuild) {
        if(!guild.chat || !guild.chat.channel || !guild.chat.channel.valid) {
            return;
        }

        const { guildService, clanService } = bot;

        const fetched = await bot.getCachedGuild(guild.guild_id);
        if(!fetched) {
            throw new Error(`Couldn't fetch discord server`);
        }

        let timestamp = (guild.chat.last_update ? guild.chat.last_update.getTime() : 0);

        const messages = await clanService.getClanMessages(guild.user_uid, guild.password_hash, guild.clan_name);
        if(!messages) {
            throw new Error(`Couldn't get clan messages for guild ${guild.guild_id}`);
        }

        const channel = await bot.getCachedGuildChannel(fetched, guild.chat.channel.id);
        if(!channel || channel.type !== ChannelType.GuildText) {
            await guildService.invalidateDiscordChannel(guild.guild_id, guild.chat.channel.id);
            throw new Error(`Couldn't fetch discord channel ${guild.chat.channel.id}`);
        }

        for(let msg of messages!) {
            if(msg.timestamp > timestamp) {
                const member = await guildService.getGuildMemberByClanUID(guild.guild_id, msg.uid);
                if(!member) {
                    logger(`Couldn't find member with clan uid ${msg.uid}!`, LoggerType.WARN);
                    break;
                }

                let processed = await processMentions(guildService, msg.content, guild.guild_id);
                processed = processEmoji(processed, fetched);

                const date = new Date(msg.timestamp);
                
                await channel.send({
                    content: `> **${member.nickname} ${dateToString(date, 'Y-M-D h:m:s')}**\n> ${processed}`
                });

                timestamp = msg.timestamp;
            }
        }

        await guildService.setGuildChat(guild.guild_id, { last_update: new Date(timestamp) });
    }
}

async function processMentions(guildService: GuildService, msg: string, guild_id: string) {
    const splits = msg.split(/(@\w*)/g);
    if(splits.length === 0) return msg;

    let ret = "";
    for(const split of splits) {
        if(!split.startsWith('@')) {
            ret += split;
            continue;
        }

        const name = split.slice(1);
        const member = await guildService.getGuildMemberByNickname(guild_id, name);
        if(!member) {
            ret += split;
            continue;
        }

        if(!member.discord) {
            ret += `**${member.nickname}**`;
            continue;
        }

        ret += `<@${member.discord.user_id}>`;
    }

    return ret;
}

function processEmoji(msg: string, guild: Guild) {
    const splits = msg.split(/(:\b[^:]*\b:)/g);
    if(splits.length === 0) return msg;
    
    let ret = "";
    for(const split of splits) {
        if(!split.startsWith(':') || !split.endsWith(':')) {
            ret += split;
            continue;
        }

        const name = split.replaceAll(':', '');
        const emoji = guild.emojis.cache.find(o => o.name === name);
        if(!emoji) {
            logger(`Didn't find emoji ${split}`, LoggerType.WARN);
            ret += split;

            continue;
        }

        ret += `${emoji}`;
    }

    return ret;
}