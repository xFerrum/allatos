import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Skill } from 'src/classes/skill';
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
      else this.bgColor = 'rgb(134, 185, 206)';
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
