export class Activity
{
    name: string; //unique identifier
    duration: number; //milliseconds
    startDate?: Date;

    constructor(name: string, duration: number)
    {
        this.name = name;
        this.duration = duration;
    }
}