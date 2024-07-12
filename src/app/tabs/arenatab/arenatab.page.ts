import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { Creature } from 'src/models/creature';
import { User } from 'src/models/user';
import { BattleService } from 'src/services/battle.service';

@Component({
  selector: 'app-arena',
  templateUrl: 'arenatab.page.html',
  styleUrls: ['arenatab.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ArenaPage implements OnInit
{
  chosenCreature!: Creature;
  creatures: Creature[] = [];
  socket: any;
  isQueueing  = false;

  constructor(public router: Router, public userService: UserService, public creatureService: CreatureService, public battleService: BattleService)
  {

  }

  async ngOnInit(): Promise<void>
  {
    //add owned creatures to array (for list)
    await this.userService.getUser(this.userService.getLoggedInID()!).then(async (user: User) =>
    {
      for (let i = 0; i < user.ownedCreatures.length; i++)
      {
        const crID = user.ownedCreatures[i];
        this.creatures.push(await this.creatureService.getCreatureById(crID));
      }
    });


  }

  chooseCreature(ev: any)
  {
    this.chosenCreature = ev.target.value;
  }

  queue()
  {
    if (this.chosenCreature && !this.chosenCreature.currentAct)
    {
      this.battleService.queueUp(this.chosenCreature);
    }
  }
}
