"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Emoji;
(function (Emoji) {
    let Character;
    (function (Character) {
        Character["A"] = "A_";
        Character["B"] = "B_";
        Character["C"] = "C_";
        Character["D"] = "D_";
        Character["E"] = "E_";
        Character["F"] = "F_";
        Character["G"] = "G_";
        Character["H"] = "H_";
        Character["I"] = "I_";
        Character["J"] = "J_";
        Character["K"] = "K_";
        Character["L"] = "L_";
        Character["M"] = "M_";
        Character["N"] = "N_";
        Character["O"] = "O_";
        Character["P"] = "P_";
        Character["Q"] = "Q_";
        Character["R"] = "R_";
        Character["S"] = "S_";
        Character["T"] = "T_";
        Character["U"] = "U_";
        Character["V"] = "V_";
        Character["W"] = "W_";
        Character["X"] = "X_";
        Character["Y"] = "Y_";
        Character["Z"] = "Z_";
    })(Character = Emoji.Character || (Emoji.Character = {}));
    Emoji.Number = [
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
    ];
    let Sign;
    (function (Sign) {
        Sign["!"] = "em_";
        Sign["?"] = "qm_";
        Sign[","] = "cm_";
        Sign["'"] = "ap_";
        Sign["/"] = "slash";
        Sign["-"] = "pause";
        Sign["\\"] = "bslash";
        Sign["_"] = "floor";
        Sign["#"] = "hashtag";
        Sign["."] = "dot";
    })(Sign = Emoji.Sign || (Emoji.Sign = {}));
    function makeEmojiWord(guild, word) {
        if (word.startsWith('<') && word.endsWith('>'))
            return word;
        word = word.toUpperCase();
        let msg = '';
        for (let char of word) {
            if (char >= '0' && char <= '9') {
                const name = Emoji.Number[parseInt(char)];
                msg += `${guild.emojis.cache.find(e => e.name == name)} `;
            }
            else if (char >= 'A' && char <= 'Z') {
                const name = Character[char];
                msg += `${guild.emojis.cache.find(e => e.name == name)} `;
            }
            else if (char in Sign) {
                const name = Sign[char];
                msg += `${guild.emojis.cache.find(e => e.name == name)} `;
            }
            else
                msg += char;
        }
        return msg;
    }
    Emoji.makeEmojiWord = makeEmojiWord;
    function makeEmojiMessageFromWords(guild, words) {
        let final = [];
        let msg = ">>> ";
        let vanilla = false, endVanilla = false;
        for (let word of words) {
            if (word.search(/\$\$/) != -1) {
                if (!vanilla)
                    vanilla = true;
                else
                    endVanilla = true;
                word = word.replace('\$\$', "");
            }
            const emoji_word = (vanilla ? word : makeEmojiWord(guild, word));
            if (emoji_word.length >= 2000) {
                return [];
            }
            else if (msg.length + emoji_word.length >= 2000) {
                final.push(msg);
                msg = ">>> ";
            }
            if (endVanilla) {
                vanilla = false;
                endVanilla = false;
            }
            msg += emoji_word;
            msg += (vanilla ? ' ' : '   ');
        }
        final.push(msg);
        return final;
    }
    Emoji.makeEmojiMessageFromWords = makeEmojiMessageFromWords;
    function makeEmojiMessage(guild, message) {
        console.log(`Msg: ${message}`);
        const words = message.split(' ');
        return makeEmojiMessageFromWords(guild, words);
    }
    Emoji.makeEmojiMessage = makeEmojiMessage;
})(Emoji || (Emoji = {}));
exports.default = Emoji;
