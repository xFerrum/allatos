export class Skill
{
    type: string;
    description = "";
    selfTarget: boolean; 
    effects: any = []; // object (map-like)
    fatCost: number;
    rarity: number;
    name: string;
    usedByP1?: boolean;
    
    constructor(type: string, selfTarget: boolean, effects: Object, fatCost: number, rarity: number, name: string)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;
        this.fatCost = fatCost;
        this.rarity = rarity;
        this.name = name;

        //construct description
        let i = 0;
        switch(type)
        {
            case "attack":
                //this.description += "Deal " + this.effects.dmg + " damage\n";

                for (let effect in this.effects)
                {
                    this.description += effect + ": " + this.effects[effect] + "\n";
                    i++

                    if (effect === "combo")
                    {
                        console.log(this.effects[effect].dmg);
                    }
                }
                break;

            case "block":
                //this.description += "Block " + this.effects.block + "\n";
                for (let effect in effects)
                {
                    this.description += effect + ": " + this.effects[effect] + "\n";
                    i++;
                }
                break;

            default:
                this.description = "Description"
          }
    }

}