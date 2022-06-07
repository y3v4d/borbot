"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClanManager = exports.ClanClass = void 0;
const tslib_1 = require("tslib");
const clickerheroes_1 = tslib_1.__importDefault(require("../api/clickerheroes"));
var ClanClass;
(function (ClanClass) {
    ClanClass[ClanClass["Rogue"] = 1] = "Rogue";
    ClanClass[ClanClass["Mage"] = 2] = "Mage";
    ClanClass[ClanClass["Priest"] = 3] = "Priest";
    ClanClass[ClanClass["Undefined"] = -1] = "Undefined";
})(ClanClass = exports.ClanClass || (exports.ClanClass = {}));
class ClanManager {
    _name = "";
    _masterUID = "";
    _members = new Map();
    _legacyRaidLevel = 0;
    _newRaidLevel = 0;
    _autoJoin = false;
    _newRaidLocked = false;
    uid;
    passwordHash;
    _messages = [];
    constructor(uid, passwordHash) {
        this.uid = uid;
        this.passwordHash = passwordHash;
    }
    static async test(uid, passwordHash) {
        try {
            await clickerheroes_1.default.getGuildInfo(uid, passwordHash);
            return true;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
    }
    async update() {
        const info = await clickerheroes_1.default.getGuildInfo(this.uid, this.passwordHash);
        this._name = info.guild.name;
        this._masterUID = info.guild.guildMasterUid;
        this._legacyRaidLevel = info.guild.currentRaidLevel;
        this._newRaidLevel = info.guild.currentNewRaidLevel;
        this._autoJoin = info.guild.autoJoin;
        this._newRaidLocked = info.guild.newRaidLocked == "true";
        this._members.clear();
        Object.values(info.guildMembers).forEach(member => {
            this._members.set(member.uid, {
                uid: member.uid,
                highestZone: parseInt(member.highestZone),
                nickname: member.nickname,
                class: parseInt(member.chosenClass),
                level: parseInt(member.classLevel),
                lastRewardTimestamp: member.lastRewardTimestamp,
                lastBonusRewardTimestamp: member.lastBonusRewardTimestamp
            });
        });
    }
    async fetchMessages() {
        this._messages = (await clickerheroes_1.default.getGuildMessages(this.uid, this.passwordHash, this.name)).messages;
    }
    async getRaidInfo() {
        await this.update();
        return await clickerheroes_1.default.getNewRaid(this.uid, this.passwordHash, this.name);
    }
    getMemberByName(name) {
        for (const m of this._members) {
            if (m[1].nickname === name)
                return m[1];
        }
        return undefined;
    }
    getMemberByUid(uid) {
        return this._members.get(uid);
    }
    getAllMembers() {
        return [...this._members.values()];
    }
    get name() { return this._name; }
    get masterUID() { return this._masterUID; }
    get legacyRaidLevel() { return this._legacyRaidLevel; }
    get newRaidLevel() { return this._newRaidLevel; }
    get autoJoin() { return this._autoJoin; }
    get newRaidLocked() { return this._newRaidLocked; }
    get messages() { return this._messages; }
}
exports.ClanManager = ClanManager;
