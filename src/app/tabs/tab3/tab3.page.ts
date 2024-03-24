import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class Tab3Page
{
  roomID!: string;

  constructor(public router: Router) {}

  //join room with given id
  joinRoom()
  {
    this.router.navigate(['/battle'],
      {
      state:
        {
          roomID: this.roomID
        }
      });
  }
}
