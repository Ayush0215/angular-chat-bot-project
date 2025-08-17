import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, FormControlName, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { LoginService } from '../../../../service/login.service';
import { SharedService } from '../../../../service/shared.service';

@Component({
  selector: 'app-addcredentialsdialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
  ],
  templateUrl: './addcredentialsdialog.component.html',
  styleUrl: './addcredentialsdialog.component.css',
})
export class AddcredentialsdialogComponent {
  userName: any;
  email: any;
  password: any;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private loginService: LoginService,
    private sharedService: SharedService,
    private dialogRef: MatDialogRef<AddcredentialsdialogComponent>
  ) {}
  onInputChange(): void {
    this.isLoading = true;
    this.loginService
      .signUp(this.userName, this.email, this.password)
      .subscribe(
        (response) => {
          this.isLoading = false;
          this.dialogRef.close('submitted'); // Close the dialog and notify parent

          this.sharedService.setMessage(`Credentials added successfully`);
        },
        (error) => {
          this.isLoading = false;
          this.errorMessage = error.error.message;
        }
      );
  }
}
