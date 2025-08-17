import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { GlobalMessageComponent } from '../global-message/global-message.component';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../service/shared.service';
import { LoginService } from '../../service/login.service';
import { GroqLlmService, ModelConfig } from '../../service/groq-llm.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [
    ChatbotComponent,
    NavbarComponent,
    SidenavComponent,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    GlobalMessageComponent,
    CommonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  showComp = true;
  isLoggedIn: boolean = false;
  modelConfig!: ModelConfig;
  modelConfigSubscription!: Subscription;
  constructor(
    private sharedService: SharedService,
    private loginService: LoginService,
    private groqLlmService: GroqLlmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.modelConfigSubscription = this.groqLlmService.modelConfig$.subscribe(
      (config) => {
        if (config) {
          this.modelConfig = { ...config }; // Avoid null assignment
        } else {
          console.warn('⚠ Received null config in HomeComponent.');
        }
      },
      (error) => {
        console.error('Error subscribing to model config:', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.modelConfigSubscription) {
      this.modelConfigSubscription.unsubscribe();
    }
  }
}
