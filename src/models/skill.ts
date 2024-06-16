export class Skill
{
    type: string;
    description = '';
    selfTarget: boolean; 
    effects: Map<string, any>;
    fatCost: number;
    rarity: number;
    name: string;
    usedByID = '';
    
    constructor(type: string, selfTarget: boolean, effects: Map<string, any>, fatCost: number, rarity: number, name: string, description?: string)
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
    }
}