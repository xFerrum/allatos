import { BehaviorSubject } from "rxjs";

export class Activity
{
    //no "props" property on client side
    name: string; //unique identifier
    description: string;
    duration: number; //milliseconds
    startDate?: Date;
    timerID!: any;
    timer$!: BehaviorSubject<number>;

    constructor(name: string, description: string, duration: number, startDate?: Date)
    {
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.startDate = startDate;
        if (this.startDate) this.startTimer();
    }

    //initializes timer$ to be an observable  emitting time left until act completion every second
    startTimer()
    {
        clearInterval(this.timerID);
        this.timer$ = new BehaviorSubject((this.startDate!.getTime() + this.duration) - Date.now());
        this.timerID = setInterval(() =>
        {
            const nextVal = (this.startDate!.getTime() + this.duration) - Date.now();
            if (nextVal <= 0) 
            {
                clearInterval(this.timerID);
                this.timer$.complete();
            }
            else this.timer$.next(nextVal);

        }, 1000);
    }
}
