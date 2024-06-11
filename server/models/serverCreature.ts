import { Activity } from "./activity";
import { Skill } from "./skill";
import { Trait } from "./trait";
import { generateSkill } from "../tools/skillGenerator";
import { Status } from "./status";

export class ServerCreature
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
    skillPicks: Array<Array<Skill>>;
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
    statuses?: Array<Status>;

    constructor(crID: string, name: string, type: string, str: number, agi: number, int: number, con: number, ini: number,
        ownedBy: string, skills: Array<Skill>, traits: Array<Trait>, stamina: number, xp: number, born: Date, level: number,
        skillPicks: Array<Array<Skill>>, lvlup: number, battlesWon: number, currentAct?: Activity)
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
        let has = false;
        this.statuses!.forEach((s) =>
        {
          if (s.name === statusName) has = true;
        });
  
        return has;
    }

    addXP(gained: number)
    {
        if (this.xp + gained < 100)
        {
            this.xp += gained;
        }
        else
        {
            this.level++;
            this.lvlup++;
            this.xp = 0 + (this.xp + gained - 100);

            let newSkillPick = [];
            for (let i = 0; i < 3; i++) newSkillPick.push(generateSkill(true, true, false));
            this.addSkillPick(newSkillPick);
        }
    }

    addSkillPick(skillPick: Array<Skill>)
    {
        if (!(this.skillPicks)) this.skillPicks = [];
        //Math.random() to avoid overwrite of skillpicks added in quick succession
        this.skillPicks.push(skillPick);
    }

    addTrait(trait: Trait)
    {
        if (!this.traits) this.traits = [];
        this.traits.push(trait);

    }

    removeTrait(traitName: string)
    {
        if (!this.traits) return;

        this.traits = this.traits.filter((t) => t.name !== traitName);
    }
}
