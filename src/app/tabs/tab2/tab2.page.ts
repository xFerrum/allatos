import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Creature } from 'src/creature';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';

const creatures: Creature[] = [];

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonicModule]
})

export class Tab2Page implements OnInit
{
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
        creatures.push(new Creature(crData!["type"], crData!["str"], crData!["agi"], crData!["con"], crData!["ini"], crData!["ownedBy"])));      }
    });

    
  }
}
