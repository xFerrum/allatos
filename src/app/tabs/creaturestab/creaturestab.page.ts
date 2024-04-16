import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Creature } from 'src/classes/creature';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { CommonModule } from '@angular/common';
import { Skill } from 'src/classes/skill';
import { PopUpService } from 'src/services/popup.service';
import { SkillGenerator } from 'server/skillGenerator';

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
  hovering = false;
  to: any; //for handling hover timeout

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
    let skillGenerator = new SkillGenerator;
    for (let index = 0; index < 5; index++)
    {
      const skillToLearn = skillGenerator.generateSkill(2, "block");
      await this.creatureService.learnSkill(this.creatures[0].crID, skillToLearn);
    }
    console.log("done");
  }

  async deleteSkills()
  {
    this.creatureService.deleteAllSkills(this.creatures[0].crID);
  }

  hoverSkill(name: string, desc: string)
  {
    this.to = setTimeout(() =>
    {
      this.popupService.skillPopUp(name, desc, 'skill-pop-up');
    }, 500);
  }

  unhoverSkill()
  {
    clearTimeout(this.to);
  }
}
