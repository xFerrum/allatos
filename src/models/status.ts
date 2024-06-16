export class Status
{
    name: string;
    description: string;
    counter: number;
    countsDown = true;

    constructor(name: string, description: string, counter: number, countsDown?: boolean)
    {
        this.name = name;
        this.description = description;
        this.counter = counter;
        if (countsDown) this.countsDown = countsDown;
    }
}