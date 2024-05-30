import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Skill } from 'src/models/skill';
import { SkillcardComponent } from '../skillcard/skillcard.component';

@Component({
  selector: 'app-skillpick',
  templateUrl: './skillpick.component.html',
  styleUrls: ['./skillpick.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, SkillcardComponent],
})
export class SkillPickComponent
{
  @Input() skills!: Skill[];
  @Input() socket!: any;
  @Input() confirmFunc!: Function;
  selectedIndexes: Array<number> = [];
  confirmEnabled = false;
  constructor() {}

  skillSelected(index: number)
  {
    //remove if already highlighted (=unhighlight)
    if (this.selectedIndexes.includes(index))
    {
      this.selectedIndexes.splice(this.selectedIndexes.indexOf(index), 1);
    }
    else this.selectedIndexes.push(index);

    if (this.selectedIndexes.length !== 1)
    {
      this.confirmEnabled = false;
    }
    else this.confirmEnabled = true;
  }

  confirmSkill()
  {
    this.socket.emit('skill-option-selected', this.selectedIndexes[0]);
    this.confirmFunc();
  }
}
