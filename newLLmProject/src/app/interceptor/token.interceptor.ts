import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private LoginService: LoginService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.LoginService.getAccessToken(); // Retrieve the current access token

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // If the token is expired (401), try to refresh it
          return this.LoginService.refreshAccessToken().pipe(
            switchMap((newToken) => {
              // Retry the original request with the new token
              req = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next.handle(req); // Reattempt the original request
            }),
            catchError(() => {
              // If refresh token fails, logout the user
              this.LoginService.logout();
              this.router.navigate(['/home']); // Redirect to login page
              return throwError(error); // Use throwError instead of Observable.throw
            })
          );
        }
        return throwError(error); // Use throwError here as well
      })
    );
  }
}
