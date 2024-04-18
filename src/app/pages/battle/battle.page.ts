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
import { SkillcardComponent } from 'src/app/small_components/skillcard/skillcard.component';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.page.html',
  styleUrls: ['./battle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SkillcardComponent]
})

export class BattlePage implements OnInit
{
  loadingDone = false; //TODO: implement loading spinner while joining
  myCrID!: string;
  myCr!: Creature;
  opCr!: Creature;
  roomID!: string;
  socket: any;
  canPick = false;
  opSkillsLength!: number;

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

    //TODO: rewrite here and on server side not to share whole opp creature object
    this.socket.on('players-ready', (cr1: Creature, cr2: Creature, p1CanPick: boolean, p2CanPick: boolean) =>
    {
      if (this.myCrID === cr1.crID)
      {
        this.updateMe(cr1, p1CanPick);
        this.updateOp(cr2, cr2.skills.length);
      }
      else if (this.myCrID === cr2.crID)
      {
        this.updateMe(cr2, p2CanPick);
        this.updateOp(cr1, cr1.skills.length);
      }

      this.loadingDone = true;
    });

    this.socket.on('player-rejoin', (myCr: Creature, canPick: boolean, opCr: Creature, opSkillsLength: number) =>
    {
      if (this.opCr === undefined) //if user is the one rejoining
      {
        if (this.myCrID === myCr.crID)
        {
          this.updateMe(myCr, canPick);
          this.updateOp(opCr, opSkillsLength);
        }
        else; //TODO: spectate

        this.loadingDone = true;
      }
      this.loadingDone = true;

    });

    this.socket.on('game-state-sent', (myCr: Creature, canPick: boolean, opCr: Creature, opSkillsLength: number) =>
    {
      this.updateMe(myCr, canPick);
      this.updateOp(opCr, opSkillsLength);
    });

    this.socket.on('log-sent', (log: string) =>
    {
      console.log(log);
    });

    this.socket.on('skill-picked', (pickedBy: Creature, canPick: boolean) =>
    {
      this.updateMe(pickedBy, canPick);
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

  updateMe(cr: Creature, canPick: boolean)
  {
    this.myCr = cr;
    this.canPick = canPick;
    this.creatureService.currentIndex = 0;
    this.creatureService.currentSkillDeck = this.myCr.skills;
  }

  updateOp(opCr: Creature, skillsLength: number)
  {
    this.opSkillsLength = skillsLength;
    this.opCr = opCr;
  }

  useSkill(index: number)
  {
    if (this.canPick)
    {
      this.socket.emit('play-skill', localStorage.getItem('loggedInID'), index);
      this.canPick = false;
    }
  }

  dummyArr(n: number)
  {
    return new Array(n);
  }
}