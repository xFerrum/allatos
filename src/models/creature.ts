import { Activity } from "./activity";
import { Skill } from "./skill";
import { Trait } from "./trait";

export class Creature
{
    crID: string;
    name: string;
    type: string;
    str: number;
    agi: number;
    int: number;
    con: number;
    ini: number;
    stamina: number;
    ownedBy: string;
    skills: Array<Skill> = [];
    traits: Array<Trait> = [];
    xp: number;
    level: number;
    born: Date;
    skillPicks: Object;
    lvlup: number;
    battlesWon: number;
    currentAct?: Activity;

    //for battle
    HP?: number;
    block?: number;
    fatigue?: number;
    turnInfo?: any;
    lingering?: any;
    deck?: Array<Skill>;
    grave?: Array<Skill>;
    statuses?: Array<Trait>; //pseudo traits

    constructor(crID: string, name: string, type: string, str: number, agi: number, int: number, con: number, ini: number,
        ownedBy: string, skills: Array<Skill>, traits: Array<Trait>, stamina: number, xp: number, born: Date, level: number,
        skillPicks: Object, lvlup: number, battlesWon: number, currentAct?: Activity)
    {
        this.crID = crID;
        this.name = name;
        this.type = type;
        this.str = str;
        this.agi = agi;
        this.int = int;
        this.con = con;
        this.ini = ini;
        this.ownedBy = ownedBy;
        this.skills = skills;
        this.traits = traits;
        this.stamina = stamina;
        this.xp = xp;
        this.born = born;
        this.currentAct = currentAct;
        this.skillPicks = skillPicks;
        this.level = level;
        this.lvlup = lvlup;
        this.battlesWon = battlesWon;
    }

    getTraitNames(): Array<string>
    {
        let nameArr = [];
        for (let trait of this.traits) nameArr.push(trait.name);
        
        return nameArr;
    }

    hasStatus(statusName: string): boolean
    {
        this.statuses!.forEach((s) =>
        {
            if (s.name === statusName) return true;
        });

        return false;
    }
}
