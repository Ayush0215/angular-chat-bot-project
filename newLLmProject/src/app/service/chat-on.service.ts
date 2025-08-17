import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

export interface Conversation {
  content: string;
  message_index: number;
  role: string;
  timestamp: any;
  conversation_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatOnService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getConversation(indexName: string): Observable<Conversation[]> {
    return this.http
      .get<Conversation[]>(
        `${this.apiUrl}/get-conversation/?index_name=${indexName}`
      )
      .pipe(
        map((conversations) =>
          conversations
            .sort((a, b) => {
              // Sort by conversation_id first
              if (a.conversation_id !== b.conversation_id) {
                return a.conversation_id.localeCompare(b.conversation_id);
              }
              // Then by message_index within each conversation
              return a.message_index - b.message_index;
            })
            .sort((a, b) => {
              const aTime = new Date(a.timestamp).getTime();
              const bTime = new Date(b.timestamp).getTime();
              return bTime - aTime; // Sort by timestamp in reverse order
            })
        ),
        catchError((error) => {
          return throwError(error);
        })
      );
  }
}
