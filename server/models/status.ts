export class Status
{
    name: string;
    description: string;
    duration: number;

    constructor(name: string, description: string, duration: number)
    {
        this.name = name;
        this.description = description;
        this.duration = duration;
    }
}