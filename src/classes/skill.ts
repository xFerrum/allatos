export class Skill
{
    type: string;
    description!: string;
    selfTarget: boolean; 
    effects: any; // object (map-like)
    fatCost: number;
    rarity: number;

    constructor(type: string, selfTarget: boolean, effects: Object, fatCost: number, rarity: number)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;
        this.fatCost = fatCost;
        this.rarity = rarity;

        //construct description
        switch(type)
        {
            case "attack":
                this.description = "Deal " + this.effects.dmg + " damage"
                break;
            default:
                this.description = "Description"
          }
    }
}