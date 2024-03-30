export class Skill
{
    type: string;
    description!: string;
    selfTarget: boolean; 
    effects: any;

    constructor(type: string, selfTarget: boolean, effects: Object)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;

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