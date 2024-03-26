import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BattleService } from 'src/services/battle.service';
import { Creature } from 'src/classes/creature';
import { Skill } from 'src/classes/skill';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.page.html',
  styleUrls: ['./battle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class BattlePage implements OnInit
{
  loadingDone = false; //TODO: implement loading spinner while joining
  myCrID!: string;
  myCr!: Creature;
  opCrID!: string;
  opCr!: Creature;
  roomID!: string;
  joinedRoom = false;

  constructor(public creatureService: CreatureService, public userService: UserService, public battleService: BattleService, private route: ActivatedRoute, private router: Router)
  {
    this.route.queryParams.subscribe(_p =>
    {
      const navParams = this.router.getCurrentNavigation()!.extras.state;
      console.log(navParams!['creatureID'])
      this.myCrID = navParams!['creatureID'];
      this.roomID = navParams!['roomID'];
      console.log(navParams!['roomID'])
    })

  }

  async ngOnInit()
  {
    this.myCr = await this.creatureService.getCreatureById(this.myCrID);
    this.loadingDone = await this.battleService.joinBattle(this.roomID, this.myCr, localStorage.getItem('loggedInID')!);
  }

  testAttack()
  {

  }

}