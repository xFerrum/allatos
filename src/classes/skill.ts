export class Skill
{
    type: string;
    description!: string;
    selfTarget: boolean; 
    effects: any;
    fatCost: number;

    constructor(type: string, selfTarget: boolean, effects: Object, fatCost: number)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;
        this.fatCost = fatCost;

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