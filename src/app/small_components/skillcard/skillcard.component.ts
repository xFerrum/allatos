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
export class SkillcardComponent  implements OnInit {

  constructor(public creatureService: CreatureService) { }

  ngOnInit() {}

}
