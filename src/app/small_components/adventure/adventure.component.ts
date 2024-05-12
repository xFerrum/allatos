import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Activity } from 'src/classes/activity';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-adventure',
  templateUrl: './adventure.component.html',
  styleUrls: ['./adventure.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})

export class AdventureComponent
{
  @Input() acts!: Activity[];
  @Input() confirmFunc!: Function;

  confirmEnabled = false;
  selectedAct!: Activity;

  constructor(public renderer: Renderer2, private elem: ElementRef) {}

  actClicked(event: any, act: Activity)
  {
    this.selectedAct = act;
    let elements = document.querySelectorAll('.act-img');
    console.log(elements);
    for (let e of elements)
    {
      console.log(e);
      this.renderer.removeClass(e, 'act-img-highlighted');
    }
    this.renderer.addClass(event.target, 'act-img-highlighted');

    this.confirmEnabled = true;
  }

  confirmAct()
  {
    this.confirmFunc();
  }
}