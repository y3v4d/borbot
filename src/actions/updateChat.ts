import { Guild } from "discord.js";
import Bot from "../core/bot";
import Action from "../core/action";
import GuildModel, { IGuild } from "../models/guild";
import MemberModel from "../models/member";
import logger, { LoggerType } from "../shared/logger";
import ClanService, { ClanMember } from "../services/clanService";

const CHAT = '983503510479990785';

function composeDate(date: Date) {
    return `${date.getUTCDate().toString().padStart(2, '0')}.` +
            `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.` +
            `${date.getUTCFullYear()} ` +
            `${date.getUTCHours().toString().padStart(2, '0')}:` +
            `${date.getUTCMinutes().toString().padStart(2, '0')}:` +
            `${date.getUTCSeconds().toString().padStart(2, '0')}`; 
}

async function processMentions(msg: string, guild: Guild, members: ClanMember[]) {
    const splits = msg.split(/(@\w*)/g);
    if(splits.length === 0) return msg;

    let ret = "";
    for(const split of splits) {
        if(!split.startsWith('@')) {
            ret += split;
            continue;
        }

        const name = split.slice(1);
        const clanMember = members.find(o => o.nickname === name);
        if(!clanMember) {
            ret += split;
            continue;
        }

        const dbMember = await MemberModel.findOne({ clan_uid: clanMember.uid });
        if(!dbMember) {
            ret += split;
            continue;
        }

        const guildMember = await guild.members.fetch(dbMember.guild_uid);
        if(!guildMember) {
            ret += split;
            continue;
        }

        ret += `${guildMember}`;
    }

    return ret;
}

async function processEmoji(msg: string, guild: Guild) {
    const splits = msg.split(/(:\b[^:]*\b:)/g);
    if(splits.length === 0) return msg;
    
    let ret = "";
    for(const split of splits) {
        if(!split.startsWith(':') || !split.endsWith(':')) {
            ret += split;
            continue;
        }

        const name = split.replaceAll(':', '');
        const emoji = await guild.emojis.cache.find(o => o.name === name);
        if(!emoji) {
            console.log(`Didn't find emoji ${split}`);
            ret += split;

            continue;
        }

        ret += `${emoji}`;
    }

    return ret;
}

export const UpdateChat: Action = {
    run: async function(client: Bot, guild: IGuild) {
        const fetched = await client.guilds.cache.get(guild.guild_id);
        if(!fetched) {
            logger(`#updateChat Couldn't get guild ${guild.guild_id}`);
            return;
        }
        
        logger(`#updateChat in ${fetched.name}`);

        let timestamp = (guild.last_chat_update === undefined ? 0 : guild.last_chat_update);

        const clan = await ClanService.getClanInformation(guild.user_uid, guild.password_hash);
        const messages = await ClanService.getClanMessages(guild.user_uid, guild.password_hash, clan!.name);

        const channel = await fetched.channels.cache.get(CHAT);
        if(!channel || !channel.isText()) {
            logger("#updateChat Couldn't find valid chat channel!", LoggerType.ERROR);
            return;
        }

        for(let msg of messages!) {
            if(msg.timestamp > timestamp) {
                let processed = await processMentions(msg.content, fetched, clan!.members);
                processed = await processEmoji(processed, fetched);

                const date = new Date(msg.timestamp * 1000);
                await channel.send({
                    content: `> **${clan!.members.find(o => o.uid === msg.uid)?.nickname || "Unkown"} ${composeDate(date)}**\n> ${processed}`
                });

                timestamp = msg.timestamp;
            }
        }

        guild.last_chat_update = timestamp;
        await GuildModel.updateOne(guild);
    },

    startOnInit: true,
    repeat: true,

    timeout: 1
}