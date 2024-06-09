import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonModal, IonPopover, IonicModule, ModalController } from '@ionic/angular';
import { Creature } from 'src/models/creature';
import { Skill } from 'src/models/skill';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { io } from 'socket.io-client';
import { SkillcardComponent } from 'src/app/small_components/skillcard/skillcard.component';
import { AnimationController } from '@ionic/angular/standalone';
import { PopUpService } from 'src/services/popup.service';
import { ProgressbarComponent } from 'src/app/small_components/progressbar/progressbar.component';
import { Trait } from 'src/models/trait';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.page.html',
  styleUrls: ['./battle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SkillcardComponent, ProgressbarComponent]
})

export class BattlePage implements OnInit
{
  @ViewChild('popover') popover!: IonPopover;
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
  traitShowing = false;
  traitToShow!: Trait;
  playerWon: any;
  hiddenMyCr!: Creature;
  hiddenOpCr!: Creature;

  @ViewChild(IonModal) modal!: IonModal;
  
  //for animation
  actionChain: any[] = [];
  snapshotChain: any[] = [];
  hitFor!: number;
  animating = false;
  skillToDisplay = new Skill('', false, {}, 0, 0, '');
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
      await this.socket.emit('join-room', this.myCr, this.roomID, (joinSuccessful: boolean) => {
        if (joinSuccessful)
        {
          console.log("Joined room " + this.roomID);
          localStorage.setItem('isInBattle', 'true'); //TODO: navigate user to battle page by default if isInBattle
        }
      });
    });

    this.socket.on('players-ready', () =>
    {
      this.socket.emit('game-state-requested');
    });

    this.socket.on('player-rejoin', () =>
    {
      this.socket.emit('game-state-requested');
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
      else
      {
        this.turnInfo = "Action!";
        this.hiddenMyCr = myCr;
        this.hiddenOpCr = opCr;
      }

      this.loadingDone = true;
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

    this.socket.on('snapshot-sent', (myCr: Creature, opCr: Creature, opSkillsLength: number) =>
    {
      this.snapshotChain.push({ myCr: myCr, opCr: opCr, opSkillsLength: opSkillsLength });
    });

    this.socket.on('turn-ended', async () =>
    {
      await this.EOTAnimations();
      this.actionChain = [];

      if (this.playerWon)
      {
        if (this.playerWon === this.myCr.ownedBy)
        {
          await this.popUpService.gameOverPopUp('', 'gameover', 'You won!');
        }
        else
        {
          await this.popUpService.gameOverPopUp('', 'gameover', 'You lost.');
        }
        this.playerWon = null;
        this.socket.disconnect;
      }
    });

    this.socket.on('player-won', (uid: string) =>
    {
      this.playerWon = uid;
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
    this.socket.emit('play-skill', this.userService.getLoggedInID(), index);
  }

  dummyArr(n: number)
  {
    return new Array(n);
  }

  closeSkill()
  {
    this.modal.dismiss();
  }

  traitClicked(e: Event, trait: Trait)
  {
    this.traitToShow = {...trait};
    this.popover.event = e;
    this.traitShowing = true;
  }

  /*---------------------------------------------------------------ANIMATION STUFF---------------------------------------------------------------*/

  //TODO: make played cards appear next to op or my side of the board
  async EOTAnimations()
  {
    this.animating = true;
    const showCardFor = 2700;
    const showEffectFor = 2000;
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
      else if (a.type === 'gain-block')
      {
        this.updateBlock(a.block, a.actorID);
      }
      else if (a.type === 'remove-block')
      {
        this.updateBlock(a.block, a.actorID);
      }

      const newStats = this.snapshotChain.shift();
      this.updateMe(newStats.myCr, false);
      this.updateOp(newStats.opCr, newStats.opSkillsLength);
    }

    if (this.hiddenMyCr.turnInfo.fatigued)
    {
      await this.popUpService.effectPopUp(this.myCr.name + " is fatigued and needs to rest!", 'hit-popup');
      await this.delay(showEffectFor);
      await this.popUpService.dismissPopUp();
    }

    if (this.hiddenOpCr.turnInfo.fatigued)
    {
      await this.popUpService.effectPopUp(this.opCr.name + " is fatigued and needs to rest!", 'hit-popup');
      await this.delay(showEffectFor);
      await this.popUpService.dismissPopUp();
    }

    this.animating = false;
    this.socket.emit('game-state-requested');
  }

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

/*   async hitAnimation(action: any, showFor: number)
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
  } */

  delay(ms: number)
  {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}