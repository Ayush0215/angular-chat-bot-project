import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { SharedService } from '../../service/shared.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LlmConversationService } from '../../service/llm-conversation.service';

import { trigger, transition, style, animate } from '@angular/animations';
import { ChatOnComponent } from '../chat-on/chat-on.component';
import { RouterLink } from '@angular/router';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { DeleteConfirmationDialogComponent } from '../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { response } from 'express';

@Component({
  selector: 'app-sidenav',
  imports: [
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    CommonModule,
    FormsModule,
    RouterLink,
    MatMenu,
    MatMenuModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class SidenavComponent implements OnInit {
  sidenavWidth: number = 250; // Default width
  isSidenavVisible: boolean = true;

  indexes: string[] = [];
  isLoading: boolean = false;
  isCreating: boolean = false;
  currentIndex: string = '';
  ConversationId: string = '';

  indexToDelete: string = '';

  private subscription: Subscription[] = [];

  constructor(
    private sharedService: SharedService,
    private llmconv: LlmConversationService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.sharedService.sidenavWidth$.subscribe((width) => {
      this.sidenavWidth = width;
      this.isSidenavVisible = width > 1; // If width > 1, make the sidenav visible
    });

    this.subscription.push(
      this.sharedService.isCreatingIndex$.subscribe((isCreating) => {
        this.isCreating = isCreating;
      })
    );

    this.subscription.push(
      this.llmconv.indexes$.subscribe((indexes) => {
        this.indexes = indexes;
        this.cdr.detectChanges();
      })
    );
    this.llmconv.fetchIndexes();
    this.loadIndexes();
  }

  loadIndexes() {
    this.llmconv.getIndexes().subscribe({
      next: (response) => {
        this.indexes = response.indexes || [];
        // If there are indexes and none is selected, select the first one
        if (this.indexes.length > 0 && !this.currentIndex) {
          this.setCurrentIndex(this.indexes[0]);
        }
      },
      error: (error) => {
        console.error('Failed to load indexes', error);
      },
    });
  }

  openDeleteDialog() {
    if (!this.indexToDelete) {
      console.error('No index to delete');
      return;
    }
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteIndex(this.indexToDelete);
      }
    });
  }
  setIndexForDeletion(indexName: string) {
    this.indexToDelete = indexName;
  }
  deleteIndex(indexName: string) {
    this.isLoading = true;
    this.llmconv.deleteIndex(indexName).subscribe(
      (response: any) => {
        this.sharedService.setMessage('Conversation Deleted!');
        this.isLoading = false;
      },
      (error: any) => {
        console.error('Error deleting index:', error);
        this.isLoading = false;
      }
    );
  }

  setCurrentIndex(index: string): void {
    if (!index) {
      console.error('Index name is empty');
      return;
    }
    this.currentIndex = index;
    this.llmconv.setIndexName(index);
    this.sharedService.updateCurrentIndex(index);
  }
}
