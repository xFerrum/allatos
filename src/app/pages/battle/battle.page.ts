import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BattleService } from 'src/services/battle.service';
import { Creature } from 'src/classes/creature';
import { Skill } from 'src/classes/skill';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.page.html',
  styleUrls: ['./battle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class BattlePage implements OnInit
{
  p1cr!: Creature;
  p2cr!: Creature;
  roomID: string;
  joinedRoom = false; //TODO: implement loading while joining

  constructor(public creatureService: CreatureService, public userService: UserService, public battleService: BattleService)
  {
    this.roomID = history.state.roomID;
  }

  ngOnInit()
  {
    this.battleService.initializeBattle(this.roomID);
  }

}