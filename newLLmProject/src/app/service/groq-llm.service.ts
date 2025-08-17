import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError, BehaviorSubject } from 'rxjs';
import { tap, filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ModelConfig {
  model_name: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  status: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatChoice {
  message: ChatMessage;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  choices: ChatChoice[];
}
@Injectable({
  providedIn: 'root',
})
export class GroqLlmService {
  private localApi = 'http://localhost:8000/model/config';

  private modelConfigSubject = new BehaviorSubject<ModelConfig | null>(null);
  modelConfig$ = this.modelConfigSubject.asObservable().pipe(
    filter((config): config is ModelConfig => config !== null) // Ensure non-null values
  );
  constructor(private http: HttpClient) {
    this.fetchModelConfig();
  }

  // fetchModelConfig() {
  //   this.http
  //     .get<ModelConfig>(this.localApi)
  //     .pipe(
  //       tap((config) => {
  //         this.modelConfigSubject.next(config);
  //       }),
  //       catchError((error) => {
  //         console.error('Error fetching model config:', error);
  //         return throwError(() => new Error('Failed to fetch model config.'));
  //       })
  //     )
  //     .subscribe();
  // }

  // Update fetchModelConfig
  fetchModelConfig() {
    this.http
      .get<ModelConfig>(this.localApi)
      .pipe(
        tap((config) => {
          this.modelConfigSubject.next(config);
        })
      )
      .subscribe();
  }

  getModelConfig(): Observable<ModelConfig> {
    return this.modelConfig$;
  }

  // Update the model configuration (PUT)
  updateModelConfig(config: Partial<ModelConfig>): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<any>(this.localApi, config, { headers }).pipe(
      tap(() => {
        this.fetchModelConfig(); // Triggers update
      }),
      catchError((error) => {
        console.error('Error updating model config:', error);
        return throwError(() => new Error('Failed to update model config.'));
      })
    );
  }

  getResponse(userMessage: string, model: string): Observable<any> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const apiKey = environment.apiKey;
    const body = {
      model,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Groq-Organization': environment.orgId,
    });

    return this.http.post(url, body, { headers }).pipe(
      catchError((error) => {
        console.error('Groq API error:', error);
        return throwError(() => new Error('Failed to fetch AI response.'));
      })
    );
  }
  // getResponse(userMessage: string): Observable<ChatResponse> {
  //   if (!this.modelConfig) {
  //     return this.getModelConfig().pipe(
  //       switchMap(() => this.fetchResponse(userMessage))
  //     );
  //   } else {
  //     return this.fetchResponse(userMessage);
  //   }
  // }

  // /**
  //  * Internal function to call the AI model API.
  //  */
  // private fetchResponse(userMessage: string): Observable<ChatResponse> {
  //   const modelName =
  //     this.modelConfig?.model_name || 'deepseek-r1-distill-llama-70b';
  //   const body = {
  //     model: modelName,
  //     messages: [{ role: 'user', content: userMessage }],
  //     max_completion_tokens: this.modelConfig?.max_tokens || 1024,
  //     temperature: this.modelConfig?.temperature || 0.7,
  //     top_p: this.modelConfig?.top_p || 0.9,
  //   };

  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${this.apiKey}`,
  //     'Content-Type': 'application/json',
  //   });

  //   return this.http
  //     .post<ChatResponse>(this.apiUrl, body, { headers })
  //     .pipe(catchError(this.handleError));
  // }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(
      () => new Error('Something went wrong with the API request.')
    );
  }

  // getResponse(userMessage: string): Observable<any> {
  //   const body = {
  //     model: 'deepseek-r1-distill-llama-70b',
  //     messages: [{ role: 'user', content: userMessage }],
  //     max_completion_tokens: 4096,
  //   };

  //   const headers = {
  //     Authorization: `Bearer ${this.apiKey}`,
  //     'Content-Type': 'application/json',
  //   };

  //   return this.http.post<any>(this.apiUrl, body, { headers });
  // }
}
