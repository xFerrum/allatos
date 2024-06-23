
import { Injectable } from "@angular/core";
import { io } from "socket.io-client";
import { Creature } from "src/models/creature";
import { Router } from "@angular/router";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root',
})

export class BattleService
{
    socket: any;
    isInBattle = false;
    crInBattle!: Creature;
    isQueueing = false;

    constructor(public router: Router) {}

    queueUp(cr: Creature)
    {
        this.socket = io('https://allatos-services.onrender.com:3000');
        this.socket.on('players-ready', () =>
        {
            this.isQueueing = false;
            this.crInBattle = cr;
            this.isInBattle = true;
            this.router.navigate(['battle']);
        });
        this.socket.on('disconnect', () =>
        {
            this.isQueueing = false;
            this.isInBattle = false;
        });

        this.socket.emit('queue-up', cr.ownedBy, cr.crID, () => { this.isQueueing = true; } );

    }

    queueState$(): Observable<boolean>
    {
        return new Observable<boolean>(subscriber =>
        {
          subscriber.next(this.isQueueing);
        });
    }
}