import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Creature } from 'src/creature';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creatures',
  templateUrl: 'creaturestab.page.html',
  styleUrls: ['creaturestab.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})

export class CreaturesPage implements OnInit
{
  //TODO: handle array of creatures instead of a single one
  creatures: Creature[] = [];
  loadingDone = false;
  constructor(public creatureService: CreatureService, public userService: UserService)
  {}

  async ngOnInit(): Promise<void>
  {
    //get creatures owned by the logged in user, then add them to the "creatures" array
    await this.userService.getUserDetails(localStorage.getItem("loggedInID")!).then(async (data: any) =>
    {
      for (let index = 0; index < data["ownedCreatures"].length; index++)
      {
        const crID = data["ownedCreatures"][0];
        await this.creatureService.getCreatureDetails(crID).then((crData: any) =>
        this.creatures.push(new Creature(crData!["type"], crData!["str"], crData!["agi"], crData!["con"], crData!["ini"], crData!["ownedBy"])));
      }
    });

    this.loadingDone = true;
  }
}
