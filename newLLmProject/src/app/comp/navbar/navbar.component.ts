import {
  Component,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { SharedService } from '../../service/shared.service';
import { MatIconModule } from '@angular/material/icon';
import { LlmConversationService } from '../../service/llm-conversation.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { LoginComponent } from '../login/login.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NewConversationDialogComponent } from '../new-conversation-dialog/new-conversation-dialog.component';
import { Subscription, combineLatest } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { LoginService } from '../../service/login.service';
import { GlobalSearchService } from '../../service/global-search.service';
import { GlobalsearchComponent } from '../globalsearch/globalsearch.component';

@Component({
  selector: 'app-navbar',
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule,
    MatMenuModule,
    RouterLink,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentTheme: string;
  isSidenavOpened = true;
  isLoggedIn: boolean = false;
  isLoading: boolean = false;
  userName: string = '';
  loginStatusSubscription: Subscription | null = null;
  userNameSubscription: Subscription | null = null;
  userRole: string = '';
  userType: string = '';
  private dialogRef: MatDialogRef<GlobalsearchComponent> | null = null;

  private subscriptions: Subscription[] = [];

  @ViewChild(SidenavComponent) sidenav!: SidenavComponent;

  constructor(
    private sharedService: SharedService,
    public llmconv: LlmConversationService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private loginService: LoginService,
    private searchService: GlobalSearchService
  ) {
    this.currentTheme = this.sharedService.getTheme();
    this.sharedService.setTheme(this.currentTheme);
  }

  ngOnInit(): void {
    // Subscribe to login status
    this.subscriptions.push(
      this.loginService.isLoggedIn$.subscribe((status) => {
        this.isLoggedIn = status;
        if (status) {
          this.userName = localStorage.getItem('userName') || '';
        }
        this.cdr.detectChanges();
      })
    );

    // Subscribe to user role
    this.subscriptions.push(
      this.loginService.userRole$.subscribe((role) => {
        this.userRole = role;
        this.cdr.detectChanges();
      })
    );

    // Check initial values from localStorage
    const storedRole = localStorage.getItem('userType');
    if (storedRole) {
      this.userRole = storedRole;
    }
  }
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.sharedService.setTheme(this.currentTheme);
  }

  callToggleSidenav(): void {
    this.sharedService.toggleSidenav();
    this.isSidenavOpened = !this.isSidenavOpened;
  }

  createNewIndex(): void {
    const dialogRef = this.dialog.open(NewConversationDialogComponent, {
      width: '400px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const sanitizedName = result.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        this.isLoading = true;
        this.llmconv
          .createNewIndex({ conversation_name: sanitizedName })
          .subscribe({
            next: (response) => {
              this.sharedService.setMessage('New Conversation is Created');
              if (response.index_name) {
                this.llmconv.setIndexName(response.index_name);
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error details:', error);
              let errorMessage = 'Failed to create index';
              if (error.error && error.error.detail) {
                errorMessage += `: ${error.error.detail}`;
              }
              alert(errorMessage);
              this.isLoading = false;
            },
          });
      }
    });
  }

  loginUser(): void {
    this.isLoggedIn = true;
  }
  logoutUser(): void {
    this.isLoggedIn = false;
  }

  onLogout(): void {
    this.loginService.logout();
    this.sharedService.setMessage('You have been logged out!');
  }

  checkLoginState(): void {
    const storedUserName = localStorage.getItem('username');
    const storedUserType = localStorage.getItem('userType');

    this.isLoggedIn = !!storedUserName && !!storedUserType;
    this.userName = storedUserName || '';
    this.userType = storedUserType || '';
  }

  openSearchDialog() {
    if (!this.dialogRef) {
      this.dialogRef = this.dialog.open(GlobalsearchComponent, {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '400px',
        panelClass: 'custom-dialog',
      });

      // Reset the reference when the dialog is closed
      this.dialogRef.afterClosed().subscribe(() => {
        this.dialogRef = null;
      });
    }
  }
  @HostListener('document: keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      this.openSearchDialog();
    }
  }
}
