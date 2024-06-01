export class Trait
{
    name: string;
    description: string;
    scaling: boolean;
    
    constructor(name: string, description: string, scaling: boolean)
    {
        this.name = name;
        this.description = description;
        this.scaling = scaling;
    }
}