/* tslint:disable:unknown-word */
import { ChangeDetectorRef, Component, DoCheck, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { IonModal, IonicModule } from '@ionic/angular';
import { Creature } from 'src/models/creature';
import { CreatureService } from 'src/services/creature.service';
import { UserService } from 'src/services/user.service';
import { CommonModule } from '@angular/common';
import { Skill } from 'src/models/skill';
import { PopUpService } from 'src/services/popup.service';
import { SkillcardComponent } from 'src/app/small_components/skillcard/skillcard.component';
import { Trait } from 'src/models/trait';
import { io } from 'socket.io-client';
import { ModalController, ViewWillLeave } from '@ionic/angular/standalone';
import { SkillPickComponent } from 'src/app/small_components/skillpick/skillpick.component';
import { Activity } from 'src/models/activity';
import { AdventureComponent } from 'src/app/small_components/adventure/adventure.component';
import { TimerPipe } from 'src/services/timerPipe';
import { BehaviorSubject, Observer } from 'rxjs';
import { ActService } from 'src/services/act.service';
import { IonPopover } from '@ionic/angular/common';
import { ProgressbarComponent } from 'src/app/small_components/progressbar/progressbar.component';

@Component({
  selector: 'app-creatures',
  templateUrl: 'creaturestab.page.html',
  styleUrls: ['creaturestab.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, SkillcardComponent, SkillPickComponent, AdventureComponent, TimerPipe, ProgressbarComponent]
})

export class CreaturesPage implements OnInit, ViewWillLeave
{
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('popover') popover!: IonPopover;
  creatures: Creature[] = [];
  loadingDone = false;
  hovering = false;
  traitShowing = false;
  traitToShow!: Trait;
  socket: any;
  waitingForLearn = false;

  constructor(public creatureService: CreatureService, public userService: UserService, public popUpService: PopUpService, public modalCtrl: ModalController, public actService: ActService,
    public cdr: ChangeDetectorRef)
  {}

  async ngOnInit(): Promise<void>
  {
    await this.creatureService.initCreatures(this.creatures, await this.userService.getUser(this.userService.getLoggedInID()!));

    this.loadingDone = true;
  }

  ionViewWillLeave(): void
  {
    this.popover.dismiss();
  }

  //socket disconnects on server side after skill is picked
  async learn(cr: Creature)
  {
    this.socket = io('http://localhost:3005');
    //validate cr belongs to user (firebase rule)
    this.socket.emit('skill-learn-requested', (await this.creatureService.getCreatureById(cr.crID)).crID);

    this.popUpService.loadingPopUp("Preparing the skills...");

    this.socket.on('skill-pick-ready', async (skillOptions: Array<Skill>) =>
    {
      await this.popUpService.dismissPopUp();
      const pickModal = await this.modalCtrl.create(
      {
        component: SkillPickComponent,
        componentProps:
        {
          'skills': skillOptions,
          'socket': this.socket,
          'confirmFunc': (() => {pickModal.dismiss()}),
        },
        backdropDismiss: false,
      },
    );

      pickModal.present();
    });
  }

  async startActClicked(cr: Creature)
  {
    const actModal = await this.modalCtrl.create(
    {
      component: AdventureComponent,
      componentProps:
      {
        'acts': await this.actService.getAllActs(),
        'confirmFunc': ((act: Activity) => { actModal.dismiss(); this.fireAct(cr, act)}),
      },
      cssClass: 'act-modal'
    },
  );

    actModal.present();
  }

  //returns days
  calcAge(born: Date): number
  {
    return Math.floor(((new Date()).getTime() - born.getTime())/(1000 * 60 * 60 * 24));
  }

  traitClicked(e: Event, trait: Trait)
  {
    this.traitToShow = {...trait};
    this.popover.event = e;
    this.traitShowing = true;
  }

  closeSkills()
  {
    this.modal.dismiss(null, 'cancel');
  }

  fireAct(cr: Creature, act: Activity)
  {
    this.socket = io('http://localhost:3010');
    act.startDate = new Date;
    this.socket.emit('start-activity', cr.crID, act);
    this.socket.on('start-activity-failed', () => { /*failed*/ });
  }
}
