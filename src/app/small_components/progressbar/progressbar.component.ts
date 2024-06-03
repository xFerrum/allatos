import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progressbar',
  templateUrl: './progressbar.component.html',
  styleUrls: ['./progressbar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ProgressbarComponent implements OnInit
{
  @Input() type!: string;
  @Input() current!: number;
  @Input() total!: number;
  outerBg!: string;

  constructor()
  {

  }

  ngOnInit(): void
  {
    this.outerBg = "url('/assets/bars/" + this.type + "/mid_bar.png')";
  }

}
