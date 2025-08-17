import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ChatbotComponent } from './comp/chatbot/chatbot.component';
import { NavbarComponent } from './comp/navbar/navbar.component';
import { SidenavComponent } from './comp/sidenav/sidenav.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { GlobalMessageComponent } from './comp/global-message/global-message.component';
import { SharedService } from './service/shared.service';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './comp/home/home.component';
import { LoginService } from './service/login.service';
import { AuthInterceptor } from './interceptor/auth.interceptor';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    RouterModule,
  ],
  providers: [LoginService, AuthInterceptor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'ChatBot AI';

  showComp = true;
  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.showComp = this.sharedService.shouldShowSharedComponents();
  }
}
