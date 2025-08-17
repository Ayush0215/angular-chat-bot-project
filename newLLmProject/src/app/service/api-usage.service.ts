import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface APIUsage {
  id: string;
  user_id: string;
  model_name: string;
  request_count: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiUsageService {
  private apiUrl = 'http://localhost:8000/api-usage/';
  constructor(private http: HttpClient) {}

  getApiUsage(): Observable<APIUsage[]> {
    return this.http.get<APIUsage[]>(this.apiUrl);
  }
}
