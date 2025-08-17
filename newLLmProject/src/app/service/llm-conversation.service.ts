import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap, catchError, map } from 'rxjs/operators';
import { SafeHtml } from '@angular/platform-browser';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface Response {
  messages: Message[];
}
export interface Conversation {
  content: string;
  message_index: number;
  role: string;
  timestamp: string;
  conversation_id: string;
}
export interface CreateIndexResponse {
  index_name: string;
}

export interface Conversation {
  messages: Message[];
}
interface ConversationResponse {
  data: Conversation[];
  total: number;
  has_more: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LlmConversationService {
  private readonly apiUrl = environment.pineconeApiURL;
  private readonly defaultTopK = 5; // Default number of similar results

  private messages: Message[] = [];
  private currentIndexSubject = new BehaviorSubject<string | null>(null);
  private indexesSubject = new BehaviorSubject<string[]>([]);

  // Public observables for external use
  public readonly currentIndex$ = this.currentIndexSubject.asObservable();
  public readonly indexes$ = this.indexesSubject.asObservable();

  private currentConversationSubject = new BehaviorSubject<
    ConversationResponse[]
  >([]);
  public readonly currentConversation$ =
    this.currentConversationSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Creates a new index with the specified conversation name.
   * @param data Object containing the conversation name.
   * @returns Observable of the CreateIndexResponse.
   */
  createNewIndex(data: {
    conversation_name: string;
  }): Observable<CreateIndexResponse> {
    return this.http
      .post<CreateIndexResponse>(`${this.apiUrl}/create-index`, {
        conversation_name: data.conversation_name,
      })
      .pipe(
        tap((response) => {
          if (response.index_name) {
            this.currentIndexSubject.next(response.index_name);
            this.fetchIndexes();
          }
        }),
        catchError(this.handleError('createNewIndex'))
      );
  }

  /**
   * Retrieves stored messages.
   * @returns Array of messages.
   */
  getMessages(): Message[] {
    return this.messages;
  }

  /**
   * Stores messages in a specified index.
   * @param messages Array of messages to store.
   * @param indexName Name of the index where messages will be stored.
   * @returns Observable of the HTTP response.
   */

  storeMessages(messages: Message[], indexName: string): Observable<any> {
    const conversation: Response = {
      messages: messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      })),
    };

    return this.http
      .post(
        `${this.apiUrl}/store-conversation?index_name=${indexName}`,
        conversation
      )
      .pipe(catchError(this.handleError('storeMessages')));
  }

  /**
   * Searches for similar messages using a query.
   * @param query Query string to search.
   * @param topK Number of top results to fetch (default is 5).
   * @returns Observable of the search results.
   */
  searchSimilar(
    query: string,
    topK: number = this.defaultTopK
  ): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/search-similar/${query}?top_k=${topK}`)
      .pipe(catchError(this.handleError('searchSimilar')));
  }

  /**
   * Sets the current index name.
   * @param indexName Name of the index to set.
   */
  setIndexName(indexName: string): void {
    this.currentIndexSubject.next(indexName);
  }

  /**
   * Retrieves the current index name.
   * @returns Current index name or null if not set.
   */
  getIndexName(): string | null {
    return this.currentIndexSubject.value;
  }

  /**
   * Deletes a specified index.
   * @param indexName Name of the index to delete.
   * @returns Observable of the HTTP response.
   */
  deleteIndex(indexName: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-index/${indexName}`).pipe(
      tap(() => this.fetchIndexes()),
      catchError(this.handleError('deleteIndex'))
    );
  }

  /**
   * Fetches all available indexes from the backend.
   */
  fetchIndexes(): void {
    this.http
      .get<{ indexes: string[] }>(`${this.apiUrl}/indexes`)
      .pipe(catchError(this.handleError('fetchIndexes')))
      .subscribe(
        (response) => this.indexesSubject.next(response.indexes),
        (error) => console.error('Error fetching indexes:', error)
      );
  }

  /**
   * Centralized error handler for HTTP requests.
   * @param operation Name of the operation that caused the error.
   * @returns Function to handle errors.
   */
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`Error in ${operation}:`, error);
      throw error;
    };
  }

  private baseUrl = 'http://localhost:8000'; // Update with your FastAPI URL

  getIndexes(): Observable<{ indexes: string[] }> {
    return this.http.get<{ indexes: string[] }>(`${this.baseUrl}/indexes`);
  }

  updateCurrentConversation(conversation: ConversationResponse[]): void {
    this.currentConversationSubject.next(conversation);
  }

  getConversation(
    indexName: string,
    limit: number,
    offset: number,
    groupBy?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<ConversationResponse> {
    // Build query parameters dynamically
    let params = new HttpParams()
      .set('index_name', indexName)
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (groupBy) {
      params = params.set('group_by', groupBy);
    }
    if (sortBy) {
      params = params.set('sort_by', sortBy).set('sort_order', sortOrder);
    }

    return this.http
      .get<ConversationResponse>(`${this.apiUrl}/get-conversation/`, { params })
      .pipe(
        map((response) => ({
          // Remove client-side sorting if using server-side sorting
          data: this.reverseConversation(response.data),
          total: response.total,
          has_more: response.has_more,
        })),
        catchError((error) => {
          console.error('Error fetching conversations:', error);
          return throwError(
            () =>
              new Error('Failed to load conversations. Please try again later.')
          );
        })
      );
  }
  private reverseConversation(conversation: any[]): any[] {
    return conversation.slice().reverse();
  }
  uploadConversation(userInput: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('userInput', userInput);
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/upload-conversation/`, formData).pipe(
      tap(response => console.log('Upload response:', response)
      ),
      catchError(this.handleError('uploadConversation'))
    )
  }
}
