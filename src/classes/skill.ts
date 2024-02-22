export class Skill
{
    type: string;
    dmg: number;
    heal: number;

    constructor(type: string, dmg: number, heal: number)
    {
        this.type = type;
        this.dmg = dmg;
        this.heal = heal;
    }
}