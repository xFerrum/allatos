export class Activity
{
    name: string; //unique identifier
    duration: number; //seconds
    startDate?: Date;

    constructor(name: string, duration: number)
    {
        this.name = name;
        this.duration = duration;
    }
}