import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
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
  name: string;
  type: string;
  desc: string;

  constructor(public creatureService: CreatureService)
  {
    this.name = this.creatureService.currentSkillDeck![this.creatureService.currentIndex!].name;
    this.type = this.creatureService.currentSkillDeck![this.creatureService.currentIndex!].type;
    this.desc = this.creatureService.currentSkillDeck![this.creatureService.currentIndex!].description;

    this.creatureService.currentIndex! += 1;
  }

  ngOnInit() {}

}
