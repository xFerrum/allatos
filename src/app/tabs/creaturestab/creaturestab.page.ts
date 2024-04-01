import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Creature } from 'src/classes/creature';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { CommonModule } from '@angular/common';
import { Skill } from 'src/classes/skill';
import { PopUpService } from 'src/services/popup.service';

@Component({
  selector: 'app-creatures',
  templateUrl: 'creaturestab.page.html',
  styleUrls: ['creaturestab.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})

export class CreaturesPage implements OnInit
{
  creatures: Creature[] = [];
  loadingDone = false;
  constructor(public creatureService: CreatureService, public userService: UserService, public popupService: PopUpService)
  {}

  async ngOnInit(): Promise<void>
  {
    //add owned creatures to array
    await this.userService.getUserDetails(localStorage.getItem("loggedInID")!).then(async (data: any) =>
    {
      for (let i = 0; i < data["ownedCreatures"].length; i++)
      {
        const crID = data["ownedCreatures"][i];
        this.creatures.push(await this.creatureService.getCreatureById(crID));
      }
    });

    this.loadingDone = true;
  }

  async learn()
  {

  }

  openSkill(name: string, desc: string)
  {
    this.popupService.skillPopUp(name, desc);
  }
}
