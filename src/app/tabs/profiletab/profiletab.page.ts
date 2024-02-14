import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { UserService } from 'src/services/user.service';
import { Router } from '@angular/router';
import { PopUpService } from 'src/services/popup.service';

@Component({ 
  selector: 'app-profile',
  templateUrl: 'profiletab.page.html',
  styleUrls: ['profiletab.page.scss'],
  standalone: true,
  imports: [IonicModule],
})

export class ProfilePage implements OnInit{
  username!: string; 
  email!: string;

  constructor(public userService: UserService, public router: Router, public popUpService: PopUpService)
  {}

  async ngOnInit(): Promise<void>
  {
    let userService = new UserService;
    let userData = await userService.getUserDetails(localStorage.getItem("loggedInID")!);
    this.username = userData!["username"];
    this.email = userData!["email"];
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
}
