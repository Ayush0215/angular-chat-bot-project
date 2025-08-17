import { Component, HostListener, OnInit } from '@angular/core';
import { GlobalSearchService } from '../../service/global-search.service';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule, NgSwitch, NgSwitchCase } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { SecurityComponent } from '../profile-dashbord/security/security.component';
@Component({
  selector: 'app-globalsearch',
  imports: [CommonModule, FormsModule, MatDialogContent],
  templateUrl: './globalsearch.component.html',
  styleUrl: './globalsearch.component.css',
})
export class GlobalsearchComponent implements OnInit {
  constructor(
    private searchService: GlobalSearchService,
    private router: Router,
    private dialogRef: MatDialogRef<GlobalsearchComponent>
  ) {}
  searchQuery: string = '';
  searchResults: any[] = [];
  allResults: any[] = [];
  isLoading: boolean = false;
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after typing
        distinctUntilChanged(), // Ignore duplicate searches
        switchMap((query) => this.searchService.search(query))
      )
      .subscribe((results) => {
        this.searchResults = results;
      });
  }

  onSearch(): void {
    // Check if search query is empty or contains only spaces
    if (this.searchQuery.trim() && this.searchQuery.length >= 1) {
      this.isLoading = true;
      this.searchService.search(this.searchQuery).subscribe(
        (response) => {
          this.searchResults = response.results;
          this.isLoading = false;
        },
        (error) => {
          console.error('Error searching:', error);
          this.isLoading = false;
        }
      );
    } else {
      // Reset the search results if the query is empty
      this.searchResults = [];
    }
  }
  closeDialog() {
    this.dialogRef.close();
  }
  @HostListener('document: keydown.escape')
  handleEscapeKey() {
    this.closeDialog();
  }
  // navigateTo(result: any) {
  //   // Example: Navigate to a specific route based on the result type
  //   if (result.type === 'conversation') {
  //     this.router.navigate(['/conversation', result.id]);
  //   } else if (result.type === 'user') {
  //     this.router.navigate(['/profile', result.id]);
  //   } else if (result.type === 'security') {
  //     this.router.navigate(['/prodashboard/security']);
  //     this.dialogRef.close();
  //   }
  // }
  navigateTo(result: any) {
    // Define a mapping of result types to navigation paths
    const navigationMap: { [key: string]: string[] } = {
      conversation: ['/conversation', result.id],
      user: ['/profile', result.id],
      security: ['/prodashboard/security'],
      chatOn: ['/chat', result.id],
      
      // Add more mappings as needed
      
    };
    

    // Get the navigation path from the mapping
    const navigationPath = navigationMap[result.type];

    if (navigationPath) {
      this.router.navigate(navigationPath); // Navigate to the path
      this.closeDialog(); // Close the search dialog after navigation
    } else {
      console.warn(`No navigation path defined for type: ${result.type}`);
    }
  }
}