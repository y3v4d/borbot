import { Guild } from "discord.js";

namespace Emoji {
    export enum Character {
        'A' = 'A_',
        'B' = 'B_',
        'C' = 'C_',
        'D' = 'D_',
        'E' = 'E_',
        'F' = 'F_',
        'G' = 'G_',
        'H' = 'H_',
        'I' = 'I_',
        'J' = 'J_',
        'K' = 'K_',
        'L' = 'L_',
        'M' = 'M_',
        'N' = 'N_',
        'O' = 'O_',
        'P' = 'P_',
        'Q' = 'Q_',
        'R' = 'R_',
        'S' = 'S_',
        'T' = 'T_',
        'U' = 'U_',
        'V' = 'V_',
        'W' = 'W_',
        'X' = 'X_',
        'Y' = 'Y_',
        'Z' = 'Z_'
    }

    export const Number: string[] = [
        "0_",
        "1_",
        "2_",
        "3_",
        "4_",
        "5_",
        "6_",
        "7_",
        "8_",
        "9_"
    ]

    export enum Sign {
        '!' = 'em_',
        '?' = 'qm_',
        ',' = 'cm_',
        '\'' = 'ap_',
        '/' = 'slash',
        '-' = 'pause',
        '\\' = 'bslash',
        '_' = 'floor',
        '#' = 'hashtag',
        '.' = 'dot'
    }

    export function makeEmojiWord(guild: Guild, word: string) {
        if(word.startsWith('<') && word.endsWith('>')) return word;
        word = word.toUpperCase();

        let msg = '';
        for(let char of word) {
            if(char >= '0' && char <= '9') {
                const name = Number[parseInt(char)];

                msg += `${guild.emojis.cache.find(e => e.name == name)} `;
            } else if(char >= 'A' && char <= 'Z') {
                const name = (Character as any)[char];

                msg += `${guild.emojis.cache.find(e => e.name == name)} `;
            } else if(char in Sign) {
                const name = (Sign as any)[char];

                msg += `${guild.emojis.cache.find(e => e.name == name)} `;
            } else msg += char;
        }

        return msg;
    }

    export function makeEmojiMessageFromWords(guild: Guild, words: string[]) {
        let final: string[] = [];

        let msg = ">>> ";
        let vanilla = false, endVanilla = false;
        for(let word of words) {
            if(word.search(/\$\$/) != -1) {
                if(!vanilla) vanilla = true;
                else endVanilla = true;

                word = word.replace('\$\$', "");
            }
            
            const emoji_word = (vanilla ? word : makeEmojiWord(guild, word));
            if(emoji_word.length >= 2000) {
                return [];
            } else if(msg.length + emoji_word.length >= 2000) {
                final.push(msg);
                msg = ">>> ";
            }

            if(endVanilla) {
                vanilla = false;
                endVanilla = false;
            }

            msg += emoji_word;
            msg += (vanilla ? ' ' : '   ');
        }
        final.push(msg);

        return final;
    }

    export function makeEmojiMessage(guild: Guild, message: string) {
        console.log(`Msg: ${message}`);
        const words = message.split(' ');

        return makeEmojiMessageFromWords(guild, words);
    }
}

export default Emoji;