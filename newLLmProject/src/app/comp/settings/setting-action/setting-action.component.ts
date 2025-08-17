import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AddcredentialsdialogComponent } from './addcredentialsdialog/addcredentialsdialog.component';
import { GlobalMessageComponent } from '../../global-message/global-message.component';
import { LoginService } from '../../../service/login.service';
import { DeleteConfirmationDialogComponent } from '../../delete-confirmation-dialog/delete-confirmation-dialog.component';
import { SharedService } from '../../../service/shared.service';
import { EditCredentialsDialogComponent } from './edit-credentials-dialog/edit-credentials-dialog.component';
import {
  MatFormField,
  MatFormFieldControl,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

export interface ActionElement {
  actionName: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-setting-action',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    GlobalMessageComponent,
    MatFormFieldModule,
  ],
  templateUrl: './setting-action.component.html',
  styleUrl: './setting-action.component.css',
})
export class SettingActionComponent implements OnInit {
  data: any[] = [];

  constructor(
    private dialog: MatDialog,
    private loginService: LoginService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadCredentials();
  }

  openDialog() {
    // Add your logic for opening the dialog here
    const dialogRef = this.dialog.open(AddcredentialsdialogComponent, {
      width: '400px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('The dialog was closed');
        this.loadCredentials();
      }
    });
  }
  loadCredentials() {
    this.loginService.getCredentials().subscribe({
      next: (response) => {
        this.data = response;
      },
      error: (error) => {
        console.error('Error fetching credentials:', error);
      },
    });
  }
  reloadData(updatedCredentials: any): void {
    // Update the table with the newly added credentials
    this.data = updatedCredentials;
  }

  openDeleteDialog(uid: string): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Proceed with deletion if confirmed
        this.deleteCredential(uid);
      }
    });
  }

  deleteCredential(UId: string): void {
    this.loginService.deleteCredentials(UId).subscribe(
      (response) => {
        this.sharedService.setMessage(`Credentials Deleted successfully`);
        // Handle success (e.g., show a message or update the UI)
        this.loadCredentials();
      },
      (error) => {
        this.sharedService.setMessage('Error deleting credential');
        // Handle error (e.g., show an error message)
      }
    );
  }
  openEditDialog(element: any): void {
    const dialogRef = this.dialog.open(EditCredentialsDialogComponent, {
      width: '500px',
      data: element,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('The dialog was closed with new data:', result);
        this.loadCredentials(); // Reload credentials after update
      }
    });
  }
}
