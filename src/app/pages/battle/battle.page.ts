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

  @ViewChild(IonModal) modal!: IonModal;
  
  //for animation
  myBlocks: Skill[] = [];
  opBlocks: Skill[] = [];
  myAttacks: Skill[] = [];
  opAttacks: Skill[] = [];
  myHits: number[] = [];
  opHits: number[] = [];
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

      }
      this.loadingDone = true;

    });

    this.socket.on('game-state-sent', (myCr: Creature, canPick: boolean, opCr: Creature, opSkillsLength: number) =>
    {
      this.myCr.turnInfo.fatigued = myCr.turnInfo.fatigued;
      this.opCr.turnInfo.fatigued = opCr.turnInfo.fatigued;

      if (!this.animating)
      {
        this.updateMe(myCr, canPick);
        this.updateOp(opCr, opSkillsLength);
      }
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

    this.socket.on('block-action', (actor: Creature, skill: Skill) =>
    {
      if (actor.ownedBy === this.myCr.ownedBy)
      {
        this.myBlocks.push(skill);
      }
      else this.opBlocks.push(skill);
    });

    this.socket.on('attack-action', (actor: Creature, skill: Skill) =>
    {
      if (actor.ownedBy === this.myCr.ownedBy)
      {
        this.myAttacks.push(skill);
      }
      else this.opAttacks.push(skill);
    });

    this.socket.on('got-hit', (target: Creature, dmg: number) =>
    {
      if (target.ownedBy === this.myCr.ownedBy)
        {
          this.opHits.push(dmg);
        }
        else this.myHits.push(dmg);
    });

    this.socket.on('turn-ended', async () =>
    {
      await this.EOTAnimations();
      this.myBlocks = [];
      this.myAttacks = [];
      this.opBlocks = [];
      this.opAttacks = [];

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
  async EOTAnimations()
  {
    this.animating = true;
    const showCardFor = 1600;
    const showEffectFor = 1200;
    const inBetween = 500;

    this.what = "blocks";

    this.who = this.myCr.name;
    for (let s of this.myBlocks)
    {
      this.skillToDisplay = s;
      this.showPlayedSkill = true;
      await this.delay(showCardFor);
      this.modal.dismiss();
      this.showPlayedSkill = false;
      await this.delay(inBetween);
    }

    this.who = this.opCr.name;
    for (let s of this.opBlocks)
    {
      this.skillToDisplay = s;
      this.showPlayedSkill = true;
      await this.delay(showCardFor);
      this.modal.dismiss();
      this.showPlayedSkill = false;
      await this.delay(inBetween);
    }


    this.what = "attacks";

    let i = 0;
    for (let s of this.myAttacks)
    {
      this.who = this.myCr.name;
      this.skillToDisplay = s;
      this.showPlayedSkill = true;
      await this.delay(showCardFor);
      this.modal.dismiss();
      this.showPlayedSkill = false;
      await this.delay(inBetween);

      this.who = this.opCr.name;
      this.hitFor = this.myHits[i];
      if (this.hitFor > 0)
      {
        await this.popUpService.effectPopUp(this.who + " got hit for " + this.hitFor + " damage!", 'hit-popup');
      } else  this.popUpService.effectPopUp(this.who + " defended successfully!", 'hit-popup');
      await this.delay(showEffectFor);
      await this.popUpService.dismissPopUp();
      await this.delay(inBetween);
      i++;
    }

    i = 0;
    for (let s of this.opAttacks)
    {
      this.who = this.opCr.name;
      this.skillToDisplay = s;
      this.showPlayedSkill = true;
      await this.delay(showCardFor);
      this.modal.dismiss();
      this.showPlayedSkill = false;
      await this.delay(inBetween);

      this.who = this.myCr.name;
      this.hitFor = this.opHits[i];
      if (this.hitFor > 0)
      {
        await this.popUpService.effectPopUp(this.who + " got hit for " + this.hitFor + " damage!", 'hit-popup');
      } else  this.popUpService.effectPopUp(this.who + " defended successfully!", 'hit-popup');
      await this.delay(showEffectFor);
      await this.popUpService.dismissPopUp();
      await this.delay(inBetween);
      i++;
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