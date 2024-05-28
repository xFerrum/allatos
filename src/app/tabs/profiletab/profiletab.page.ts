import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { IonicModule, ViewDidEnter, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { UserService } from 'src/services/user.service';
import { Router } from '@angular/router';
import { PopUpService } from 'src/services/popup.service';
import { CommonModule } from '@angular/common';

@Component({ 
  selector: 'app-profile',
  templateUrl: 'profiletab.page.html',
  styleUrls: ['profiletab.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})

export class ProfilePage implements OnInit {
  username!: string; 
  email!: string;
  loadingDone = false;

  constructor(public userService: UserService, public router: Router, public popUpService: PopUpService)
  {}

  async ngOnInit(): Promise<void>
  {
    await this.loadProfileDetails();

    this.loadingDone = true;
  }

  async signOut()
  {
    this.popUpService.loadingPopUp("Logging out");
  
    if (await this.userService.signUserOut())
    {
      this.router.navigate(['']);
    }
    
    await this.popUpService.dismissPopUp();
  }

  async loadProfileDetails()
  {
    let user = await this.userService.getUser(this.userService.getLoggedInID()!);
    this.username = user.username;
    this.email = user.email;
  }
}
