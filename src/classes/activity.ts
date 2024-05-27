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
            this.timer$.next((this.startDate!.getTime() + this.duration) - new Date().getTime());
            if (this.timer$.value <= 0) 
            {
                clearInterval(this.timerID);
                this.timer$.complete();
            }
        }, 1000);
    }
}