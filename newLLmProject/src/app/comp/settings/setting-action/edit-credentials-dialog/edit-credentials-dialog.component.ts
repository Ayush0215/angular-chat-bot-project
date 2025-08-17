import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../../../../service/login.service';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SharedService } from '../../../../service/shared.service';

@Component({
  selector: 'app-edit-credentials-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatOptionModule,
    ReactiveFormsModule,
    MatInput,
    MatInputModule,
    MatDialogContent,
    MatError,
    MatDialogActions,
    MatSelectModule,
  ],
  templateUrl: './edit-credentials-dialog.component.html',
  styleUrl: './edit-credentials-dialog.component.css',
})
export class EditCredentialsDialogComponent {
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditCredentialsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private loginService: LoginService,
    private sharedService: SharedService
  ) {
    this.editForm = this.fb.group({
      userName: [data.userName, Validators.required],
      email: [data.email, [Validators.required, Validators.email]],
      password: [data.password, Validators.required],
      type: [data.type, Validators.required],
    });
  }
  onSave(): void {
    if (this.editForm.valid) {
      const updatedData = this.editForm.value;
      const credentialsToUpdate = {
        userName: updatedData.userName,
        email: updatedData.email,
        password: updatedData.password,
        type: updatedData.type,
      };

      this.loginService
        .updateCredentials(this.data.Uid, credentialsToUpdate)
        .subscribe({
          next: (response) => {
            this.sharedService.setMessage('Credentials updated successfully');
            this.dialogRef.close(updatedData);
          },
          error: (err) => {
            console.error('Error updating credentials:', err);
          },
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
