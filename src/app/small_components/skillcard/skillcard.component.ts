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


  constructor(public creatureService: CreatureService)
  {

  }

  ngOnInit()
  {

  }

}
