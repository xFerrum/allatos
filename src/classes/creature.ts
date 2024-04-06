import { Skill } from "./skill";

export class Creature
{
    crID: string;
    name: string;
    type: string;
    str: number;
    agi: number;
    con: number;
    ini: number;
    stamina: number;
    ownedBy: string;
    skills: Array<Skill> = [];
    HP?: number;
    block?: number;
    fatigue?: number;
    turnInfo?: any;
    lingering?: any;
    deck?: Array<Skill>;
    grave?: Array<Skill>;

    constructor(crID: string, name: string, type: string, str: number, agi: number, con: number, ini: number, ownedBy: string, skills: Array<Skill>, stamina: number)
    {
        this.crID = crID;
        this.name = name;
        this.type = type;
        this.str = str;
        this.agi = agi;
        this.con = con;
        this.ini = ini;
        this.ownedBy = ownedBy;
        this.skills = skills;
        this.stamina = stamina;
    }
}
