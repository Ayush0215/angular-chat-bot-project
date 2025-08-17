import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalSearchService {
  private apiUrl = 'http://localhost:8000/search'; // Replace with your API endpoint

  constructor(private http: HttpClient) {}

  search(query: string): Observable<any> {
    let params = new HttpParams().set('q', query);
    return this.http.get<any>(this.apiUrl, { params });
  }
}