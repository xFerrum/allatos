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
  myHP!: number;
  opHP!: number;
  canPick = false;

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

    //TODO: shorten next 2 funcs
    this.socket.on('players-ready', (cr1: Creature, cr2: Creature, hp1: number, hp2: number) =>
    {
      if (this.myCrID === cr1.crID)
      {
        this.isPlayerOne = true;
        this.opCr = cr2;
        this.opUID = cr2.ownedBy;
        this.myCr.HP = hp1;
        this.opCr.HP = hp2;
      }
      else if (this.myCrID === cr2.crID)
      {
        this.isPlayerOne = false;
        this.opCr = cr1;
        this.opUID = cr1.ownedBy;
        this.myCr.HP = hp2;
        this.opCr.HP = hp1;
      }

      this.canPick = true;
      this.loadingDone = true;
    });

    this.socket.on('player-rejoin', (cr1: Creature, cr2: Creature, hp1: number, hp2: number, canPick: boolean) =>
    {
      if (this.opCr === undefined) //if user is the one rejoining
      {
        if (this.myCrID === cr1.crID)
        {
          this.myCr = cr1;
          this.isPlayerOne = true;
          this.opCr = cr2;
          this.opUID = cr2.ownedBy;
          this.myCr.HP = hp1;
          this.opCr.HP = hp2;
        }
        else if (this.myCrID === cr2.crID)
        {
          this.myCr = cr2;
          this.isPlayerOne = false;
          this.opCr = cr1;
          this.opUID = cr1.ownedBy;
          this.myCr.HP = hp2;
          this.opCr.HP = hp1;
        }
        else; //TODO: spectate

        this.canPick = canPick;
        this.loadingDone = true;
      }
    });

    this.socket.on('log-sent', (log: string) =>
    {
      console.log(log);
    });

    this.socket.on('game-state-sent', (cr1: Creature, cr2: Creature, hp1: number, hp2: number, p1CanPick: boolean, p2CanPick: boolean) =>
    {
      if (this.myCrID === cr1.crID)
        {
          this.myCr = cr1;
          this.isPlayerOne = true;
          this.opCr = cr2;
          this.opUID = cr2.ownedBy;
          this.myCr.HP = hp1;
          this.opCr.HP = hp2;
          this.canPick = p1CanPick
        }
        else if (this.myCrID === cr2.crID)
        {
          this.myCr = cr2;
          this.isPlayerOne = false;
          this.opCr = cr1;
          this.opUID = cr1.ownedBy;
          this.myCr.HP = hp2;
          this.opCr.HP = hp1;
          this.canPick = p2CanPick;
        }
    });

    this.socket.on('player-won', (uid: string) =>
    {
      if (uid === this.myCr.ownedBy)
      {
        console.log("You won.")
      }
      else console.log("You lost.")
    });
  }

  useSkill(skill: Skill)
  {
    if (this.canPick)
    {
      this.socket.emit('play-skill', localStorage.getItem('loggedInID'), skill);
      this.canPick = false;
    }
  }
}