import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Creature } from 'src/classes/creature';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { CommonModule } from '@angular/common';
import { Skill } from 'src/classes/skill';

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
        this.creatures.push(new Creature(crData!["type"], crData!["str"], crData!["agi"], crData!["con"], crData!["ini"], crData!["ownedBy"], crData!["skills"])));
      }
    });

    this.loadingDone = true;
  }

  async learn()
  {
    const newSkill = new Skill("attack", 15, 0);
    await this.creatureService.learnSkill("LHDQdHhn0uinvgqaiQ69", newSkill);
    console.log(this.creatures[0].skills);
  }
}
