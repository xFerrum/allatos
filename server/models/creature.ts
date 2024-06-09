import { Activity } from "./activity";
import { Skill } from "./skill";
import { Trait } from "./trait";
import { generateSkill } from "../tools/skillGenerator";

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
    status?: Array<Trait>; //pseudo traits

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
            for (let i = 0; i < 3; i++) newSkillPick.push(generateSkill(0));
            this.addSkillPick(newSkillPick);
        }
    }

    addSkillPick(skillPick: Array<Skill>)
    {
        if (!(this.skillPicks)) this.skillPicks = {};
        this.skillPicks[(new Date().getTime())] = skillPick;
    }

    addTrait(trait: Trait)
    {
        if (!this.traits) this.traits = [];
        this.traits.push(trait);

    }

    removeTrait(traitName: string)
    {
        if (!this.traits) return;

        this.traits.forEach((t) =>
        {
            if (t.name === traitName)
            {
                console.log("asd");
                this.traits.splice(this.traits.indexOf(t), 1);
            }
        });
    }
}
