import { Component, OnDestroy } from '@angular/core';
import { SharedService } from '../../service/shared.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../service/login.service';
import { response } from 'express';

@Component({
  selector: 'app-sign-up',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent implements OnDestroy {
  constructor(
    private sharedService: SharedService,
    private router: Router,
    private loginService: LoginService
  ) {
    this.sharedService.setShowSharedComponents(false);
  }

  // Variables
  isLoading: boolean = false;
  errorMessage: string = '';
  userName: string = '';
  email: string = '';
  password: string = '';
  isPasswordVisible: boolean = false;
  passwordVisible = false;
  isSignUpVisible = true;
  confirmPassword: string = '';

  ngOnDestroy(): void {
    this.sharedService.setShowSharedComponents(true);
  }

  toggleSignUpVisibility(): void {
    this.isSignUpVisible = !this.isSignUpVisible;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
    const passwordInput = document.querySelector('input[name="password"]');
    if (passwordInput) {
      passwordInput.setAttribute(
        'type',
        this.passwordVisible ? 'text' : 'password'
      );
    }
  }

  onSignUp() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    } else {
      this.isLoading = true;

      // Call the API to sign up
      this.loginService
        .signUp(this.userName, this.email, this.password)
        .subscribe(
          (response) => {
            this.isLoading = false;
            this.sharedService.setMessage(`You have been signed up!`);
            this.router.navigate(['/login']);
          },
          (error) => {
            this.isLoading = false;
            this.errorMessage = error.error.message;
          }
        );
    }
  }
  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
