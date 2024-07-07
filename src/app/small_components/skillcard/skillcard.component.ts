import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Skill } from 'src/models/skill';
import { CreatureService } from 'src/services/creature.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skillcard',
  templateUrl: './skillcard.component.html',
  styleUrls: ['./skillcard.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SkillcardComponent  implements OnInit
{
  @Input() skill!: Skill;
  @Input() index!: number;
  @Input() pickable = false;
  @Output() highlightEvent = new EventEmitter<number>();
  bgColor!: string;
  textColor!: string;
  highlighted = false;

  constructor(public creatureService: CreatureService)
  {
  }

  ngOnInit()
  {
    if (this.skill.type === 'attack')
      {
        this.bgColor = 'rgb(224, 127, 127)';
      }
      else this.bgColor = 'rgb(131, 167, 182)';

    if (this.skill.rarity == 0)
    {
      this.textColor = 'rgb(220, 220, 220)';
    }
    else if (this.skill.rarity == 1)
    {
      this.textColor = 'rgb(121, 200, 203)';
    }
    else if (this.skill.rarity == 2) this.textColor = 'rgb(255, 182, 0)';
  }

  highlightCard()
  {
    if (this.pickable)
    {
      this.highlightEvent.emit(this.index);
      this.highlighted = !this.highlighted;
    }
  }
}
