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
                    

                        case "Weakened":
                            this.description += "Apply " + this.effects["Weakened"][0] + " Weakened";
                            if (this.effects["Weakened"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Vulnerable":
                            this.description += "Apply " + this.effects["Vulnerable"][0] + " Vulnerable";
                            if (this.effects["Vulnerable"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Pumped":
                            this.description += "Apply " + this.effects["Pumped"][0] + " Pumped";
                            if (this.effects["Pumped"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        default:
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
                        

                        case "Weakened":
                            this.description += "Apply " + this.effects["Weakened"][0] + " Weakened";
                            if (this.effects["Weakened"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Vulnerable":
                            this.description += "Apply " + this.effects["Vulnerable"][0] + " Vulnerable";
                            if (this.effects["Vulnerable"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Pumped":
                            this.description += "Apply " + this.effects["Pumped"][0] + " Pumped";
                            if (this.effects["Pumped"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        case "Bolstered":
                            this.description += "Apply " + this.effects["Bolstered"][0] + " Bolstered";
                            if (this.effects["Bolstered"][1])
                            {
                                this.description += " to self.\n";
                            }
                            else this.description += ".\n";
                            break;

                        default:
                            break;
                    }
                }
                break;

            default:
                break;
        }

        //for cards with unique effects (add a base description)
        switch(this.name)
        {
            case "Throw Off Balance":
                this.description += "If opponent used at least " + this.effects.offBalanceReq + " stamina this turn, they become Vulnerable.";
                break;

            case "Body Slam":
                this.description = "Deals damage equal to your block.";
                break;

            case "Unrelenting Defence":
                this.description += "Gain the block value of the previous block card played.";
                break;

            case "Take The High Ground":
                this.description += "Double the stamina cost of your opponent's next attack.";
                break;

            case "Punishing Blow":
                this.description += "If opponent is over fatigue limit, this deals +50% base damage.";
                break;

            default:
                break;
        }
    }

}