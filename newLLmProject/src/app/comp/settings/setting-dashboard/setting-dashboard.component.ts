import { Component, OnInit } from '@angular/core';
import { ApiUsageService, APIUsage } from '../../../service/api-usage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { LoginService } from '../../../service/login.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-setting-dashboard',
  imports: [CommonModule, FormsModule, MatSpinner, MatTableModule, RouterLink],
  templateUrl: './setting-dashboard.component.html',
  styleUrl: './setting-dashboard.component.css',
})
export class SettingDashboardComponent implements OnInit {
  displayedColumns: string[] = [
    'user_id',
    'model_name',
    'request_count',
    'timestamp',
  ];
  isLoading = true;

  constructor(
    private apiUsageService: ApiUsageService,
    private loginService: LoginService
  ) {}

  apiUsageData: APIUsage[] = [];
  accountCount: number = 0;
  adminCount: number = 0;
  employee: number = 0;

  ngOnInit(): void {
    this.fetchApiUsage();

    this.loadAccountCount();

    this.loadAccountCountType();
  }

  fetchApiUsage(): void {
    this.apiUsageService.getApiUsage().subscribe({
      next: (data) => {
        this.apiUsageData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching API usage:', error);
        this.isLoading = false;
      },
    });
  }
  loadAccountCount(): void {
    this.loginService.getAccountCount().subscribe({
      next: (response) => {
        console.log('Account Count Response:', response); // Log the response
        if (response && typeof response.account_count === 'number') {
          this.accountCount = response.account_count;
        } else {
          console.error('Account count is not a valid number');
        }
      },
      error: (error) => {
        console.error('Error fetching account count:', error);
      },
    });
  }
  loadAccountCountType(): void {
    this.loginService.getAccountCountType().subscribe({
      next: (response) => {
        this.adminCount = response.admin_count;
        this.employee = response.employee_count;
      },
      error: (error) => {
        console.error('Error fetching account count type:', error);
      },
    });
  }
}
