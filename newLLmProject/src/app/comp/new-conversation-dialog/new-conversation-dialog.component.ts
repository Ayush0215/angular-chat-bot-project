import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-conversation-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './new-conversation-dialog.component.html',
  styleUrl: './new-conversation-dialog.component.css',
})
export class NewConversationDialogComponent {
  conversationName: string = '';

  constructor(
    private dialogRef: MatDialogRef<NewConversationDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }
  onSubmit(): void {
    this.dialogRef.close(this.conversationName);
  }
}
