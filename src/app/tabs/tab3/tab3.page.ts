import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { Creature } from 'src/models/creature';
import { User } from 'src/models/user';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class Tab3Page implements OnInit
{
  roomID!: string;
  chosenCreature!: Creature;
  creatures: Creature[] = [];//TODO: only store ids

  constructor(public router: Router, public userService: UserService, public creatureService: CreatureService, public nav: NavController)
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

  //join room with given id
  joinRoom()
  {
    this.nav.navigateForward('/battle',
    {
      state:
        {
          roomID: this.roomID,
          creatureID: this.chosenCreature.crID
        }
      });

  }
}
