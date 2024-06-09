export class Skill
{
    type: string;
    description = '';
    selfTarget: boolean; 
    effects: any = [];
    fatCost: number;
    rarity: number;
    name: string;
    usedByID = '';
    
    constructor(type: string, selfTarget: boolean, effects: Object, fatCost: number, rarity: number, name: string, description?: string)
    {
        this.type = type;
        this.selfTarget = selfTarget;
        this.effects = effects;
        this.fatCost = fatCost;
        this.rarity = rarity;
        this.name = name;
        if (description)
        {
            this.description = description;
        }

        this.buildDescription();
    }

    buildDescription()
    {

        //for cards with unique effects (add a base description)
        switch(this.name)
        {
            case 'Throw Off Balance':
                this.description = 'If your opponent used at least ' + this.effects.offBalanceReq + ' fatigue this turn, they become Vulnerable.';

            default:
                this.description = '';
                break;
        }

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
    
                            case 'heavy':
                                this.description += "Heavy: " + this.effects.heavy + "\n";
                                break;

                            case 'combo':
                                this.description += "Combo: ";
                                if ('dmg' in this.effects.combo) this.description += "+" + this.effects.combo.dmg + " damage. ";
                                if ('heavy' in this.effects.combo) this.description += "+" + this.effects.combo.heavy + " heavy. ";
                                this.description += "\n";
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

                        case 'steadfast':
                            this.description += "Steadfast\n";
                            break;

                        case 'retaliate':
                            this.description += "Retaliate: ";
                            if ('dmg' in this.effects.retaliate) this.description += "Deal " + this.effects.retaliate.dmg + " damage. ";
                            this.description += "\n";
                            break;
                    }
                }
                break;

            default:
                break;
            }
    }

}