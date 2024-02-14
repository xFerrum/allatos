export class Creature
{
    type: string;
    str: number;
    agi: number;
    con: number;
    ini: number;
    ownedBy: string;

    constructor(type: string, str: number, agi: number, con: number, ini: number, ownedBy: string)
    {
        this.type = type;
        this.str = str;
        this.agi = agi;
        this.con = con;
        this.ini = ini;
        this.ownedBy = ownedBy;
    }
}
