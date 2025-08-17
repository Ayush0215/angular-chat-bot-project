import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-delete-confirmation-dialog',
  imports: [],
  templateUrl: './delete-confirmation-dialog.component.html',
  styleUrl: './delete-confirmation-dialog.component.css',
})
export class DeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Close dialog and perform delete action
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
