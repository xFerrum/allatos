import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../../explore-container/explore-container.component';

@Component({ 
  selector: 'app-profile',
  templateUrl: 'profiletab.page.html',
  styleUrls: ['profiletab.page.scss'],
  standalone: true,
  imports: [ExploreContainerComponent, IonicModule],
})
export class ProfilePage {
  constructor() {}
}
