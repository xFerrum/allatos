import { Component, OnInit, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Skill } from 'src/classes/skill';
import { CreatureService } from 'src/services/creature.service';

@Component({
  selector: 'app-skillcard',
  templateUrl: './skillcard.component.html',
  styleUrls: ['./skillcard.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class SkillcardComponent  implements OnInit
{
  @Input() skill!: Skill;
  bgColor!: string;

  constructor(public creatureService: CreatureService)
  {

  }

  ngOnInit()
  {
    if (this.skill.type === 'attack')
      {
        this.bgColor = 'rgb(224, 127, 127)';
      }
      else this.bgColor = 'rgb(134, 185, 206)';
  }

}
