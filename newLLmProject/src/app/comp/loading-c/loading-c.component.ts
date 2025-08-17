import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  trigger,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';

@Component({
  selector: 'app-loading-c',
  imports: [CommonModule],
  templateUrl: './loading-c.component.html',
  styleUrl: './loading-c.component.css',
  animations: [
    trigger('dotBounce', [
      transition('* => bouncing', [
        animate(
          '1s ease-in-out infinite',
          keyframes([
            style({ transform: 'translateY(0)', offset: 0 }),
            style({ transform: 'translateY(-6px)', offset: 0.5 }),
            style({ transform: 'translateY(0)', offset: 1 }),
          ])
        ),
      ]),
    ]),
  ],
})
export class LoadingCComponent {}
