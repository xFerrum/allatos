export class Skill
{
    type: string;
    description = "";
    selfTarget: boolean; 
    effects: any = [];
    fatCost: number;
    rarity: number;
    name: string;
    usedByID?: string;
    
    constructor(type: string, selfTarget: boolean, effects: Object, fatCost: number, rarity: number, name: string)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;
        this.fatCost = fatCost;
        this.rarity = rarity;
        this.name = name;

        this.buildDescription();
    }

    buildDescription()
    {
        switch(this.type)
        {
            case 'attack':

                for (let effect in this.effects)
                    {
                        switch(effect)
                        {
                            case 'dmg':
                                this.description += "Deal " + this.effects.dmg + " damage.\n";
                                break;
    
                            case 'shred':
                                this.description += "Shred " + this.effects.shred + " block.\n";
                                break;
    
                            case 'combo': //TODO: rework for all possible combo effects
                                this.description += "Combo: +" + this.effects.combo.dmg + " damage.\n";
                                break;
                        }
                    }
                break;

            case 'block':
                for (let effect in this.effects)
                {
                    switch(effect)
                    {
                        case 'block':
                            this.description += "Block " + this.effects.block + " damage.\n";
                            break;

                        case 'stance':
                            this.description += "Stance: " + this.effects.stance + "\n";
                            break;

                        case 'retaliate':
                            this.description += "Retaliate: " + this.effects.retaliate + "\n";
                            break;
                    }
                }
                break;

            default:
                this.description = "Description"
            }
    }

}