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
    ownedBy: string;
    skills: Array<Skill> = [];
    
    constructor(crID: string, name: string, type: string, str: number, agi: number, con: number, ini: number, ownedBy: string, skills: Array<Skill>)
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
    }
}
