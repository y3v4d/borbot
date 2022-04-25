import CH from "../api/clickerheroes";

export enum ClanClass {
    Rogue = 1,
    Mage = 2,
    Priest = 3,
    Undefined = -1
}

export interface ClanMember {
    uid: string;
    highestZone: number;
    nickname: string;
    class: ClanClass;
    level: number;
    
    lastRewardTimestamp: string;
    lastBonusRewardTimestamp: string;
}

export class ClanManager {
    private _name: string = "";
    private _masterUID: string = "";
    private _members: Map<string, ClanMember> = new Map();
    private _legacyRaidLevel: number = 0;
    private _newRaidLevel: number = 0;
    private _autoJoin: boolean = false;
    private _newRaidLocked: boolean = false;

    private uid: string;
    private passwordHash: string;

    constructor(uid: string, passwordHash: string) {
        this.uid = uid;
        this.passwordHash = passwordHash;
    }

    async update() {
        const info = await CH.getGuildInfo(this.uid, this.passwordHash);
    
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
                class: parseInt(member.chosenClass) as ClanClass,
                level: parseInt(member.classLevel),

                lastRewardTimestamp: member.lastRewardTimestamp,
                lastBonusRewardTimestamp: member.lastBonusRewardTimestamp
            } as ClanMember);
        });
    }

    getMemberByName(name: string) {
        for(const m of this._members) {
            if(m[1].nickname === name) return m[1];
        }

        return undefined;
    }

    getMemberByUid(uid: string) {
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
}