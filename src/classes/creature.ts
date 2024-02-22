import { Skill } from "./skill";

export class Creature
{
    type: string;
    str: number;
    agi: number;
    con: number;
    ini: number;
    ownedBy: string;
    skills: Array<Skill> = [];

    constructor(type: string, str: number, agi: number, con: number, ini: number, ownedBy: string, skills: Array<Skill>)
    {
        this.type = type;
        this.str = str;
        this.agi = agi;
        this.con = con;
        this.ini = ini;
        this.ownedBy = ownedBy;
        this.skills = skills;
    }
}
