import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private DapiUrl = 'http://localhost:8000';
  private tokenKey = 'accessToken';
  private userNameKey = 'userName';

  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  public userName$ = new BehaviorSubject<string>(
    localStorage.getItem(this.userNameKey) || ''
  );
  public userRole$ = new BehaviorSubject<string>(
    localStorage.getItem('userRole') || ''
  );

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthState();
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    this.isLoggedIn$.next(this.isAuthenticated());
  }

  private async checkAuthState(): Promise<void> {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      // Handle null token safely
      this.isLoggedIn$.next(false);
      return;
    }

    try {
      const isValid = await this.verifyToken(token);
      this.isLoggedIn$.next(isValid);
    } catch (error) {
      console.error('Token verification failed:', error);
      this.logout();
    }
  }

  // Call the backend to verify the token
  verifyToken(token: string): Promise<boolean> {
    return this.http
      .post<{ valid: boolean }>(`${this.DapiUrl}/verify-token/`, { token })
      .toPromise()
      .then((response) => response?.valid ?? false)
      .catch(() => false);
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.DapiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response && response.access_token) {
            // Store all relevant data
            localStorage.setItem(this.tokenKey, response.access_token);
            localStorage.setItem('userName', response.userName);
            localStorage.setItem('userType', response.type);

            // Update streams
            this.isLoggedIn$.next(true);
            this.userName$.next(response.userName);
            this.userRole$.next(response.type);

            // console.log('Stored user data:', {
            //   token: response.access_token,
            //   userName: response.userName,
            //   type: response.type,
            // });
          }
        }),
        catchError(this.handleError)
      );
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);

    if (!token) {
      this.logout();
      return false;
    }

    if (!token.includes('.')) {
      console.warn('Invalid token format');
      this.clearStorageLogout();
      this.logout();
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT
      const expiry = payload?.exp;

      if (expiry && Date.now() / 1000 > expiry) {
        console.warn('Token expired');
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Invalid token:', error);
      this.clearStorageLogout();
      return false;
    }
  }

  private clearStorageLogout(): void {
    // Explicitly remove token
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');

    // OR clear everything
    localStorage.clear();

    this.logout();
  }

  getUserDetails(email: string): Observable<any> {
    return this.http
      .post<any>(`${this.DapiUrl}/get-user-details/${email}`, {})
      .pipe(
        tap((userDetails) => {
          if (userDetails.type) {
            localStorage.setItem('userRole', userDetails.type);
            this.userRole$.next(userDetails.type);
          }
        }),
        catchError(this.handleError)
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  signUp(userName: string, email: string, password: string) {
    const apiUrl = 'http://localhost:8000/sign-up/';
    return this.http
      .post<any>(apiUrl, { userName, email, password })
      .pipe(catchError(this.handleError));
  }

  getUserSetting(): Observable<any> {
    const apiUrl = 'http://localhost:8000/setting/';
    return this.http.post<any>(apiUrl, {}).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || errorMessage;
    }
    return throwError(() => new Error(errorMessage));
  }
  getCredentials(): Observable<any[]> {
    const apiUrl = 'http://localhost:8000/credentials/';
    return this.http.get<any[]>(apiUrl);
  }

  addCredentials(credentials: any): Observable<any> {
    const apiUrl = 'http://localhost:8000/credentials/';
    return this.http.post<any>(apiUrl, credentials);
  }

  deleteCredentials(Uid: string): Observable<any> {
    return this.http.delete<any>(`http://localhost:8000/credentials/${Uid}`);
  }
  updateCredentials(Uid: string, credentials: any): Observable<any> {
    return this.http
      .put<any>(`http://localhost:8000/credentials/${Uid}`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .pipe(catchError(this.handleError));
  }
  refreshAccessToken(): Observable<string> {
    const refreshToken = localStorage.getItem('refreshToken'); // Get refresh token from storage

    return this.http
      .post<{ access_token: string }>(`${this.DapiUrl}/refresh_token/`, {
        refresh_token: refreshToken,
      })
      .pipe(
        tap((response) => {
          // Extract the access token from the response and store it
          localStorage.setItem('accessToken', response.access_token);
        }),
        // Map the response to only return the access token as a string
        map((response) => response.access_token)
      );
  }
  logout(): void {
    // Clear auth data
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userNameKey);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userType');
    localStorage.clear();

    // Update streams
    this.isLoggedIn$.next(false);
    this.userName$.next('');
    this.userRole$.next('');

    // Broadcast logout event

    this.router.navigate(['/login']);
  }

  // Handle storage events for real-time synchronization
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === this.tokenKey || event.key === 'logoutEvent') {
      // Update authentication state based on storage changes
      this.isLoggedIn$.next(this.isAuthenticated());
    }
  }
  getAccountCount() {
    return this.http.get<{ account_count: number }>(`${this.DapiUrl}/count/`);
  }
  getAccountCountType() {
    return this.http.get<{ admin_count: number; employee_count: number }>(
      'http://localhost:8000/api/accounts/count'
    );
  }
}
