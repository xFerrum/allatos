import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-skilldetails',
  templateUrl: './skilldetails.component.html',
  styleUrls: ['./skilldetails.component.scss'],
})
export class SkilldetailsComponent  implements OnInit
{
  presentingElement: any;

  constructor() { }

  ngOnInit()
  {
    this.presentingElement = document.querySelector('.ion-page');
  }

}
