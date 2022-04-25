import { Client, Message } from "discord.js";
import Emoji from "../shared/emojis";

const PREFIX = "!";

export default (client: Client): void => {
    client.on('messageCreate', async (msg: Message) => {
        if(!msg.content.startsWith(PREFIX) || msg.author.bot) return;

        const cmd = msg.content.slice(PREFIX.length).trim().split(' ', 1)[0];
        const args = msg.content.slice(PREFIX.length + cmd.length).trim();

        if(cmd === 'send') {
            await msg.channel.sendTyping();

            const startMsg = `**${msg.member!.displayName}** would like to say:\n`;
            const built = Emoji.makeEmojiMessage(msg.guild!, args);

            if(built.length === 0) {
                await msg.delete();
                await msg.channel.send(startMsg);
                await msg.channel.send(args);
            } else {
                await msg.delete();
                await msg.channel.send(startMsg);
                for(let i = 0; i < built.length; ++i) {
                    await msg.channel.send(`${built[i]}`);
                }
            }
        }
    });
}