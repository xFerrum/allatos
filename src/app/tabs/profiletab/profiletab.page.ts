import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../../explore-container/explore-container.component';
import { UserService } from 'src/services/user.service';
import { Router } from '@angular/router';

@Component({ 
  selector: 'app-profile',
  templateUrl: 'profiletab.page.html',
  styleUrls: ['profiletab.page.scss'],
  standalone: true,
  imports: [ExploreContainerComponent, IonicModule],
  providers: [UserService]
})

export class ProfilePage implements OnInit{
  username!: string; 
  email!: string;

  constructor(public userService: UserService, public router: Router)
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
    if (await this.userService.signUserOut())
    {
      this.router.navigate(['']);
    }
  }
}
