import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginService } from '../service/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private loginService: LoginService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verify the token with backend
    const isValid = await this.loginService.verifyToken(token);
    if (!isValid) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
