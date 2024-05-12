import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonModal, IonicModule, ModalController } from '@ionic/angular';
import { Creature } from 'src/classes/creature';
import { Skill } from 'src/classes/skill';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { io } from 'socket.io-client';
import { SkillcardComponent } from 'src/app/small_components/skillcard/skillcard.component';
import { AnimationController } from '@ionic/angular/standalone';
import { PopUpService } from 'src/services/popup.service';

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
  showRevealedSkill = false;
  showPlayedSkill = false;
  myBlock = 0;
  opBlock = 0;
  turnInfo = "";

  @ViewChild(IonModal) modal!: IonModal;
  
  //for animation
  actionChain: any[] = [];
  hitFor!: number;
  animating = false;
  skillToDisplay!: Skill;
  who = "actor";
  what = "action";

//TODO: validate creature id belongs to user
  //connect to socket, then room with the user's details
  //in the future the battle matchups will be created on the server side, then it will be stored on firebase (the 2 player ids and the 2 creature ids and room/battle id) this func will use those
  constructor(public creatureService: CreatureService, public userService: UserService, private route: ActivatedRoute, private router: Router, public animCtrl: AnimationController,
    public popUpService: PopUpService)
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
    this.socket.on('players-ready', () =>
    {
      this.socket.emit('game-state-requested');
      this.loadingDone = true;
    });

    this.socket.on('player-rejoin', () =>
    {
      this.socket.emit('game-state-requested');
      this.loadingDone = true;
    });

    this.socket.on('game-state-sent', (myCr: Creature, canPick: boolean, opCr: Creature, opSkillsLength: number, gameState: number) =>
    {
      if (!this.animating)
      {
        this.updateMe(myCr, canPick);
        this.updateOp(opCr, opSkillsLength);
        switch (gameState)
        {
          case 10:
            if (canPick)
            {
              this.turnInfo = "Pick your first skill to play.";
            }
            else this.turnInfo = "Waiting for opponent.";
            break;

          case 20:
            if (canPick)
            {
              this.turnInfo = "Pick your second skill to play.";
            }
            else this.turnInfo = "Waiting for opponent.";
            break;

          case 30:
            this.turnInfo = "Action!";
            break;

          default:
            this.turnInfo = "turninfo";
            break;
        }
      }
      else this.turnInfo = "Action!";

      this.myCr.turnInfo.fatigued = myCr.turnInfo.fatigued;
      this.opCr.turnInfo.fatigued = opCr.turnInfo.fatigued;
    });

    this.socket.on('log-sent', (log: string) =>
    {
      console.log(log);
    });

    this.socket.on('skill-picked', (pickedBy: Creature, canPick: boolean) =>
    {
      this.updateMe(pickedBy, canPick);
    });

    this.socket.on('skill-revealed', (skill: Skill) =>
    {
      this.skillToDisplay = skill;
      this.showRevealedSkill = true;
    });

    this.socket.on('player-won', (uid: string) =>
    {
      if (uid === this.myCr.ownedBy)
      {
        console.log("You won.")
      }
      else console.log("You lost.")
    });

    //listeners for animation

    this.socket.on('action-happened', (action: any) =>
    {
      this.actionChain.push(action);
    });

    this.socket.on('turn-ended', async () =>
    {
      await this.EOTAnimations();
      this.actionChain = [];
    });
  }

  updateMe(cr: Creature, canPick: boolean)
  {
    this.myCr = cr;
    this.canPick = canPick;
  }

  updateOp(opCr: Creature, skillsLength: number)
  {
    this.opSkillsLength = skillsLength;
    this.opCr = opCr;
  }

  updateBlock(amount: number, crID: string)
  {
    if (crID === this.myCrID)
    {
      this.myBlock += amount;
    }
    else this.opBlock += amount;
  }

  useSkill(index: number)
  {
    this.socket.emit('play-skill', localStorage.getItem('loggedInID'), index);
  }

  dummyArr(n: number)
  {
    return new Array(n);
  }

  closeSkill()
  {
    this.modal.dismiss();
  }

  //animation stuff
  async cardAnimation(s: Skill, showFor: number, what: string)
  {
    this.what = what;
    if (s.usedByID === this.myCrID)
    {
      this.who = this.myCr.name;
    }
    else
    {
      this.who = this.opCr.name;
    }
    this.skillToDisplay = s;
    this.showPlayedSkill = true;
    await this.delay(showFor);
    await this.modal.dismiss();
    this.showPlayedSkill = false;
  }

  async hitAnimation(action: any, showFor: number)
  {
    if (action.targetID === this.myCrID)
    {
      this.who = this.myCr.name;
    }
    else
    {
      this.who = this.opCr.name;
    }
    this.hitFor = action.dmg;

    if (this.hitFor > 0)
    {
      await this.popUpService.effectPopUp(this.who + " got hit for " + this.hitFor + " damage!", 'hit-popup');
    } else  this.popUpService.effectPopUp(this.who + " defended successfully!", 'hit-popup');
    await this.delay(showFor);
    await this.popUpService.dismissPopUp();
  }

  async EOTAnimations()
  {
    this.animating = true;
    const showCardFor = 1600;
    const showEffectFor = 1200;
    const inBetween = 500;

    for (let a of this.actionChain)
    {
      if (a.type === 'block')
      {
        await this.cardAnimation(a, showCardFor, "is blocking");
        await this.delay(inBetween);
      }
      else if (a.type === 'attack')
      {
        await this.cardAnimation(a, showCardFor, "attacks");
        await this.delay(inBetween);
      }
      else if (a.type === 'hit')
      {
        await this.hitAnimation(a, showCardFor);
        await this.delay(inBetween);
      }
      else if (a.type === 'gain-block')
      {
        this.updateBlock(a.block, a.actorID);
      }

    }

    if (this.myCr.turnInfo.fatigued)
    {
      await this.popUpService.effectPopUp(this.myCr.name + " is fatigued and needs to rest!", 'hit-popup');
      await this.delay(showEffectFor);
      await this.popUpService.dismissPopUp();
    }

    if (this.opCr.turnInfo.fatigued)
    {
      await this.popUpService.effectPopUp(this.opCr.name + " is fatigued and needs to rest!", 'hit-popup');
      await this.delay(showEffectFor);
      await this.popUpService.dismissPopUp();
    }

    this.animating = false;
    this.socket.emit('game-state-requested');
  }


  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}
}