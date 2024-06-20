
import { Injectable } from "@angular/core";
import { io } from "socket.io-client";
import { Creature } from "src/models/creature";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root',
})

export class BattleService
{
    socket: any;
    isInBattle = false;
    crInBattle!: Creature;
    
    constructor(public router: Router){}

    queueUp(cr: Creature)
    {
        this.socket = io('http://localhost:3000');
        this.socket.on('players-ready', () =>
        {
            this.crInBattle = cr;
            this.isInBattle = true;
            this.router.navigate(['battle']);
        });

        this.socket.emit('queue-up', cr.ownedBy, cr.crID);
    }
}