import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import {
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { SharedService } from '../../service/shared.service';
import { LoginService } from '../../service/login.service';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GlobalMessageComponent } from '../global-message/global-message.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormField,
    MatDialogModule,
    MatLabel,
    MatFormFieldModule,
    MatInputModule,
    MatIcon,
    RouterLink,
    GlobalMessageComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  gender: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoggedIn: boolean = false;
  isLoading: boolean = false;
  isPasswordVisible: boolean = false;
  message: string = '';
  userName: string = '';

  constructor(
    private sharedService: SharedService,
    private loginService: LoginService,
    private router: Router
  ) {}

  onLogin(): void {
    this.isLoading = true;

    this.loginService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        if (!response || !response.access_token) {
          console.error('No access token received');
          this.isLoading = false;
          return;
        }

        // Ensure token follows JWT format
        if (!response.access_token.includes('.')) {
          console.error('Invalid JWT format');
          this.isLoading = false;
          return;
        }

        // Store token and user details
        localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('userName', response.userName);
        localStorage.setItem('userType', response.type);

        // Update shared service
        this.sharedService.setUserName(response.userName);
        this.sharedService.setLoginState(true);

        // Navigate and show welcome message
        this.router.navigate(['/home']);
        this.sharedService.setMessage(`Welcome back, ${response.userName}!`);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.isLoading = false;
        this.sharedService.setMessage(
          'Login failed. Please check your credentials.'
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
