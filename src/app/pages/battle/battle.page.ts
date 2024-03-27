import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Creature } from 'src/classes/creature';
import { Skill } from 'src/classes/skill';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.page.html',
  styleUrls: ['./battle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class BattlePage implements OnInit
{
  loadingDone = false; //TODO: implement loading spinner while joining
  isPlayerOne = new Boolean;
  myCrID!: string;
  myCr!: Creature;
  opCr!: Creature;
  opUID!: string;
  roomID!: string;
  socket: any;

//TODO: validate creature id belongs to user
  //connect to socket, then room with the user's details
  //in the future the battle matchups will be created on the server side, then it will be stored on firebase (the 2 player ids and the 2 creature ids and room/battle id) this func will use those
  constructor(public creatureService: CreatureService, public userService: UserService, private route: ActivatedRoute, private router: Router)
  {
    this.route.queryParams.subscribe(_p =>
    {
      const navParams = this.router.getCurrentNavigation()!.extras.state;
      this.myCrID = navParams!['creatureID'];
      this.roomID = navParams!['roomID'];
    })

  }

  async ngOnInit()
  {
    this.myCr = await this.creatureService.getCreatureById(this.myCrID);
    this.socket = io('http://localhost:3000');
    //connect to server socket, join room
    this.socket.on('connect', async () =>
    {
      console.log("Connected with id:" + this.socket.id);
      await this.socket.emit('join-room', this.myCr, this.roomID, (joinSuccessful: boolean) => {
        if (joinSuccessful)
        {
          console.log("Joined room " + this.roomID);
          localStorage.setItem('isInBattle', 'true'); //TODO: navigate user to battle page by default if isInBattle
        }
      });
    });

    //
    this.socket.on('players-ready', (cr1: Creature, cr2: Creature) =>
    {
      if (this.myCr.crID === cr1.crID)
      {
        this.isPlayerOne = true;
        this.opCr = cr2;
        this.opUID = cr2.ownedBy;
      }
      else
      {
        this.isPlayerOne = false;
        this.opCr = cr1;
        this.opUID = cr1.ownedBy;
      }
      console.log(this.loadingDone);
      this.loadingDone = true;
    })
  }

  testAttack()
  {

  }

  battleStateChanged()
  {

  }
}