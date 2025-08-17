import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../service/shared.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-global-message',
  imports: [CommonModule, FormsModule],
  templateUrl: './global-message.component.html',
  styleUrl: './global-message.component.css',

  animations: [
    trigger('messageAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'translateY(0)',
        })
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'translateY(20px)',
        })
      ),
      transition('hidden => visible', [animate('300ms ease-out')]),
      transition('visible => hidden', [animate('300ms ease-in')]),
    ]),
  ],
})
export class GlobalMessageComponent implements OnInit {
  message: string | null = null;
  animationState: 'visible' | 'hidden' = 'hidden';

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sharedService.currentMessage.subscribe((message) => {
      this.message = message;
      if (message) {
        this.animationState = 'visible';

        // Clear the message and trigger fade-out after 5 seconds
        setTimeout(() => {
          this.animationState = 'hidden';
          setTimeout(() => {
            this.sharedService.clearMessage();
          }, 300); // Allow time for fade-out animation
        }, 5000);
      }
    });
  }
}
