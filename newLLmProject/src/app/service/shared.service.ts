import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private readonly themeKey = 'app-theme';

  constructor() {
    const savedTheme = localStorage.getItem(this.themeKey) || 'light';
    this.setTheme(savedTheme);
  }

  toggleTheme(): void {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: string): void {
    const trimmedTheme = theme.trim();
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);

    localStorage.setItem(this.themeKey, theme);
  }

  getTheme() {
    return localStorage.getItem(this.themeKey) || 'light';
  }

  private sidenavWidthSubject = new BehaviorSubject<number>(250); // Default width 250px
  sidenavWidth$ = this.sidenavWidthSubject.asObservable();

  private mainContentMarginSubject = new BehaviorSubject<number>(250);
  mainContentMargin$ = this.mainContentMarginSubject.asObservable();

  private loginStatusSubject = new BehaviorSubject<boolean>(false); // Holds the login status (true or false)
  loginStatus$ = this.loginStatusSubject.asObservable(); // Observable to subscribe to

  private loginMessageSubject = new BehaviorSubject<string>(''); // Holds the login error message
  loginMessage$ = this.loginMessageSubject.asObservable();

  public userNameSubject = new BehaviorSubject<string>(''); // Holds the username or empty string
  userName$ = this.userNameSubject.asObservable(); // Observable to subscribe to

  private messageSource = new BehaviorSubject<string | null>(null); // Holds the message or empty string
  currentMessage = this.messageSource.asObservable();

  private isCreatingIndex = new BehaviorSubject<boolean>(false);
  isCreatingIndex$ = this.isCreatingIndex.asObservable();

  private currentIndex = new BehaviorSubject<string>('');
  currentIndex$ = this.currentIndex.asObservable();

  public isLoggedInSource = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSource.asObservable();

  private showSharedComponents = true;
  private showLoginComponent = true;

  private userRoleSubject = new BehaviorSubject<string>(''); // Holds the user role or empty string
  userRole$ = this.userRoleSubject.asObservable(); // Observable to subscribe to

  toggleSidenav(): void {
    const currentWidth = this.sidenavWidthSubject.getValue();
    const newWidth = currentWidth === 250 ? 1 : 250;
    this.sidenavWidthSubject.next(newWidth);
    this.mainContentMarginSubject.next(newWidth);
  }

  updateIsCreatingIndex(isCreating: boolean) {
    this.isCreatingIndex.next(isCreating);
  }

  updateCurrentIndex(index: string) {
    this.currentIndex.next(index);
  }

  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text).then(
      () => {
        console.log('Copied to clipboard');
      },
      (err) => {
        console.error('Error copying to clipboard', err);
        throw err;
      }
    );
  }

  setLoginMessage(message: string): void {
    this.loginMessageSubject.next(message);
  }

  setUserName(userName: string): void {
    this.userNameSubject.next(userName);
    this.loginStatusSubject.next(!!userName); // true if userName is set, false otherwise
  }
  setMessage(message: string): void {
    this.messageSource.next(message);
  }
  clearMessage(): void {
    this.messageSource.next(null);
  }
  setLoginState(isLoggedIn: boolean): void {
    this.isLoggedInSource.next(isLoggedIn);
  }

  shouldShowSharedComponents(): boolean {
    return this.showSharedComponents;
  }
  setShowSharedComponents(value: boolean): void {
    this.showSharedComponents = value;
  }
  shouldShowLoginComponent(): boolean {
    return this.showLoginComponent;
  }

  // Setter to toggle the visibility of LoginComponent
  setShowLoginComponent(value: boolean): void {
    this.showLoginComponent = value;
  }
  setUserRole(role: string): void {
    this.userRoleSubject.next(role); // Update the role
  }

  getUserRole(): string {
    return this.userRoleSubject.getValue();
  }
}
