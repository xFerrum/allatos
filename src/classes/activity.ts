import { BehaviorSubject } from "rxjs";

export class Activity
{
    name: string; //unique identifier
    duration: number; //milliseconds
    startDate?: Date;
    timerID!: any;
    timer$!: BehaviorSubject<number>;

    constructor(name: string, duration: number)
    {
        this.name = name;
        this.duration = duration;
    }

    //initializes timer$ to be an observable  emitting time left until act completion every second
    startTimer()
    {
        clearInterval(this.timerID);
        this.timer$ = new BehaviorSubject((this.startDate!.getTime() + this.duration) - new Date().getTime());
        this.timerID = setInterval(() =>
        {
            const nextVal = (this.startDate!.getTime() + this.duration) - new Date().getTime();
            if (nextVal <= 0) 
            {
                clearInterval(this.timerID);
                this.timer$.complete();
            }
            else this.timer$.next(nextVal);

        }, 1000);
    }
}