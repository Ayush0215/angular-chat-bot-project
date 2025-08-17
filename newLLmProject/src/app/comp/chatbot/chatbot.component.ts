import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { GroqLlmService, ModelConfig } from '../../service/groq-llm.service';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  LlmConversationService,
  Message,
} from '../../service/llm-conversation.service';
import { SharedService } from '../../service/shared.service';

import hljs from 'highlight.js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,

  ],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent implements OnInit, AfterViewInit, OnDestroy {
  messages: {
    role: 'user' | 'assistant';
    content: string;
    isCode?: boolean;
    formattedContent?: SafeHtml;
    timestamp: string;
  }[] = [];

  // Store the conversation messages
  userMessage: string = ''; // User's message input
  isLoading: boolean = false; // Flag to show loading state
  isAtBottom: boolean = true;
  currentIndex: string = '';
  marginLeft: number = 250;
  selectedFile: File | null = null;
  private lastStoredMessages: Message[] = [];
  conversations: any[] = [];
  


  private subscription: Subscription = new Subscription();

  indexes: string[] = [];
  modelConfig: ModelConfig | null = null;
  private modelConfigSubscription: Subscription | null = null;

  @ViewChild('logContainer') logContainer!: ElementRef; // Reference to the message container element
  indexName: string = '';
  ConversationId!: string;

  constructor(
    private groqLlmService: GroqLlmService,
    private FormBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private sharedService: SharedService,
    private llmconv: LlmConversationService
  ) {
    
  }

  ngOnInit(): void {
    this.subscription = this.sharedService.mainContentMargin$.subscribe(
      (margin) => {
        this.marginLeft = margin;
      }
    );
    this.modelConfigSubscription = this.groqLlmService.modelConfig$.subscribe(
      (config) => {
        this.modelConfig = { ...config };
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    // this.scrollToBottom();
  }

  ngAfterViewInit(): void {
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.matches('.copy-button')) {
        const encodedText = target.getAttribute('data-copy-text');
        if (encodedText) {
          const decodedText = encodedText
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          this.copyText(decodedText, target);
        }
      }
    });
  }

  // async sendMessage(fromUserInput = true) {
  //   console.log('sendMessage() was called', {
  //     userMessage: this.userMessage,
  //     modelConfig: this.modelConfig,
  //     fromUserInput,
  //   });
  //   if (!fromUserInput) {
  //     console.warn(
  //       'sendMessage() was blocked because it was not from user input.'
  //     );
  //     return;
  //   }

  //   if (!this.userMessage || this.userMessage.trim() === '') {
  //     console.warn('Empty user input detected. Aborting request.');
  //     return;
  //   }
  //   const currentIndex = this.llmconv.getIndexName();
  //   if (!currentIndex) {
  //     alert('Please create a new index before starting the conversation.');
  //     return;
  //   }

  //   this.isLoading = true;

  //   // Fetch the latest model configuration
  //   this.groqLlmService.getModelConfig().subscribe({
  //     next: (config) => {
  //       console.log('Received Model Config:', config);
  //       if (!config || !config.model_name) {
  //         console.warn('Model config is missing, falling back to default.');
  //       }
  //       const model: string =
  //         config?.model_name || 'deepseek-r1-distill-qwen-32b';

  //       // Store user message
  //       const userMessageObj = {
  //         role: 'user' as const,
  //         content: this.userMessage,
  //         timestamp: new Date().toISOString(),
  //       };
  //       this.messages.push(userMessageObj);

  //       const userInput = this.userMessage;
  //       this.userMessage = '';

  //       // Get AI response with the latest model
  //       this.groqLlmService.getResponse(userInput, model).subscribe({
  //         next: (response) => {
  //           if (
  //             !response ||
  //             !response.choices ||
  //             response.choices.length === 0
  //           ) {
  //             console.warn('Invalid AI response format:', response);
  //             alert('AI response is missing or invalid. Please try again.');
  //             this.isLoading = false;
  //             return;
  //           }

  //           const aiResponse = response.choices[0]?.message?.content ?? '';
  //           if (!aiResponse.trim()) {
  //             console.warn('AI response is empty.');
  //             alert(
  //               'The AI did not provide a valid response. Please try again.'
  //             );
  //             this.isLoading = false;
  //             return;
  //           }

  //           // Format and store assistant message
  //           const formatResponse = this.formatResponse(aiResponse);
  //           this.messages.push({
  //             role: 'assistant',
  //             content: aiResponse,
  //             timestamp: new Date().toISOString(),
  //             formattedContent: formatResponse,
  //           });

  //           // Store new messages in Pinecone
  //           const newMessages = this.messages.filter(
  //             (msg) =>
  //               !this.lastStoredMessages.some(
  //                 (storedMsg) =>
  //                   storedMsg.content === msg.content &&
  //                   storedMsg.timestamp === msg.timestamp
  //               )
  //           );

  //           if (newMessages.length > 0) {
  //             this.llmconv.storeMessages(newMessages, currentIndex).subscribe({
  //               next: (storeResponse) => {
  //                 this.lastStoredMessages = [...this.messages];
  //               },
  //               error: (storeError) => {
  //                 console.error(' Error storing messages:', storeError);
  //               },
  //             });
  //           } else {
  //             console.log('No new messages to store.');
  //           }
  //         },
  //         error: (error) => {
  //           console.error(' API Error:', error);
  //           alert('An error occurred while fetching AI response.');
  //         },
  //         complete: () => {
  //           this.isLoading = false;
  //         },
  //       });
  //     },
  //     error: (error) => {
  //       console.error(' Model config fetch error:', error);
  //       alert('Failed to load model configuration.');
  //       this.isLoading = false;
  //     },
  //   });
  // }

  // private scrollToBottom(): void {
  //   const container = this.logContainer.nativeElement;
  //   container.scrollTop = container.scrollHeight;
  // }

  onUpload(userInput: string, file: File) {
    this.llmconv.uploadConversation(userInput, file).subscribe({
      next: (response) => {
        console.log('Frontend received:', response);
      },
      error: (error) => console.error('Upload failed:', error)
    });
  }

  async sendMessage(fromUserInput = true) {

    


    
    // Block execution if triggered by model change and no user input
    if (!fromUserInput || !this.userMessage || this.userMessage.trim() === '') {
      console.warn(
        'sendMessage() was blocked because it was not from user input or the input was empty.'
      );
      return;
    }

    const currentIndex = this.llmconv.getIndexName();
    if (!currentIndex) {
      alert('Please create a new index before starting the conversation.');
      return;
    }

    this.isLoading = true;

    // Fetch latest model configuration
    this.groqLlmService.getModelConfig().subscribe({
      next: (config) => {
        const model: string =
          config?.model_name || 'deepseek-r1-distill-qwen-32b';

        // Store user message
        const userMessageObj = {
          role: 'user' as const,
          content: this.userMessage,
          timestamp: new Date().toISOString(),
        };
        this.messages.push(userMessageObj);

        const userInput = this.userMessage;
        this.userMessage = ''; // Clear input after sending

        // Send AI request
        this.groqLlmService.getResponse(userInput, model).subscribe({
          next: (response) => {
            if (
              !response ||
              !response.choices ||
              response.choices.length === 0
            ) {
              console.warn('Invalid AI response format:', response);
              alert('AI response is missing or invalid. Please try again.');
              this.isLoading = false;
              return;
            }

            const aiResponse = response.choices[0]?.message?.content ?? '';
            if (!aiResponse.trim()) {
              console.warn('AI response is empty.');
              alert(
                'The AI did not provide a valid response. Please try again.'
              );
              this.isLoading = false;
              return;
            }

            // Store AI response in messages
            const formatResponse = this.formatResponse(aiResponse);
            this.messages.push({
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date().toISOString(),
              formattedContent: formatResponse,
            });

            // Store new messages in Pinecone
            const newMessages = this.messages.filter(
              (msg) =>
                !this.lastStoredMessages.some(
                  (storedMsg) =>
                    storedMsg.content === msg.content &&
                    storedMsg.timestamp === msg.timestamp
                )
            );

            // Only store messages if they are not empty
            if (
              newMessages.length > 0 &&
              newMessages.every((msg) => msg.content.trim() !== '')
            ) {
              this.llmconv.storeMessages(newMessages, currentIndex).subscribe({
                next: (storeResponse) => {
                  this.lastStoredMessages = [...this.messages];
                },
                error: (storeError) => {
                  console.error('Error storing messages:', storeError);
                },
              });
            } else {
              // No new messages to store or messages are empty
              // console.log('No new messages to store or messages are empty.');
            }
          },
          error: (error) => {
            console.error('API Error:', error);
            alert('An error occurred while fetching AI response.');
          },
          complete: () => {
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Model config fetch error:', error);
        alert('Failed to load model configuration.');
        this.isLoading = false;
      },
    });
  }

  copyText(textToCopy: string, button: HTMLElement): void {
    this.sharedService.copyToClipboard(textToCopy).then(
      () => {
        button.classList.add('copied');
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'Copy';
        }, 2000);
      },
      () => alert('Failed to copy the code')
    );
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Prevent form submission on Enter key press
      event.preventDefault();
    }
  }

  formatResponse(response: string): SafeHtml {
    const formatContent = (text: string): string => {
      const contentParts: string[] = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let lastIndex = 0;

      text.replace(
        codeBlockRegex,
        (match, language = 'plaintext', code, offset) => {
          // Process text before the current code block
          if (offset > lastIndex) {
            const textPart = text.substring(lastIndex, offset);
            contentParts.push(formatTextContent(textPart));
          }

          // Format the code block
          contentParts.push(formatCodeBlock(code, language.trim()));
          lastIndex = offset + match.length;
          return match;
        }
      );

      // Process remaining text
      if (lastIndex < text.length) {
        contentParts.push(formatTextContent(text.substring(lastIndex)));
      }

      return contentParts.join('');
    };

    const formatTextContent = (text: string): string => {
      let cleanText = text
        .replace(/[^\S\r\n]+/g, ' ')
        .replace(/\*{2,}/g, '')
        .replace(/\s+([.,;:?!])/g, '$1')
        .replace(/[-=]/g, ' ')
        .replace(/[#]/g, '')
        .replace(/\r\n/g, '\n');

      cleanText = cleanText.replace(
        /^(What is.*?|Types of.*?)(?:\n|$)/g,
        (match) => `<h2 class="response-heading">${match.trim()}</h2>`
      );

      cleanText = cleanText.replace(
        /^\d+\.\s*(.*?)(?:\n|$)/gm,
        (match, content) => `<li class="response-list-item">${content}</li>`
      );

      if (cleanText.includes('<li')) {
        cleanText = `<ol class="response-list">${cleanText}</ol>`;
      }

      cleanText = cleanText.replace(
        /^(?!<[ho])(.+)$/gm,
        (match) => `<p class="response-paragraph">${match}</p>`
      );

      return `<div class="text-content">${cleanText}</div>`;
    };

    const formatCodeBlock = (code: string, language: string): string => {
      const highlightedCode = hljs.highlightAuto(code, [language]).value;
      const encodedCode = code.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const languageLabel =
        language.charAt(0).toUpperCase() + language.slice(1);

      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-language">${languageLabel}</span>
            <button class="copy-button" data-copy-text="${encodedCode}">Copy</button>
          </div>
          <pre class="code-block language-${language}">
            <code class="hljs language-${language}">${highlightedCode}</code>
          </pre>
        </div>`;
    };

    const formattedContent = formatContent(response);

    return this.sanitizer.bypassSecurityTrustHtml(`
      <div class="ai-response-container">
        <style>
          /* Container styles */
          .ai-response-container {
            max-width: 100vw;
            margin: 0 auto;
            padding: 1.5rem;
            background: var(--bg-color, #ffffff);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
  
          /* Text content styles */
          .text-content {
            font-size: 1rem;
            line-height: 1.75;
            color: var(--text-color, #374151);
            margin-bottom: 1.5rem;
          }
  
          /* Heading styles */
          .response-heading {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--heading-color, #2563eb);
            margin: 1.5rem 0 1rem;
            border-bottom: 2px solid var(--border-color, #e5e7eb);
          }
  
          /* List styles */
          .response-list {
            list-style: none;
            counter-reset: item;
            padding-left: 0;
          }
  
          .response-list-item {
            position: relative;
            padding-left: 2rem;
            margin: 0.75rem 0;
          }
  
          .response-list-item::before {
            counter-increment: item;
            content: counter(item) ".";
            position: absolute;
            left: 0;
            font-weight: bold;
            color: var(--accent-color, #2563eb);
          }
  
          /* Code block styles */
          .code-block-wrapper { 
            border-radius: 8px;
            transition: all 0.2s ease-in-out;
           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            
          }
          .code-block-wrapper:hover { 
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
            border: none;
          }
  
          .code-header {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: var(--code-header-bg, #2d2d2d);
            color: #e0e0e0;
          }
  
          .code-language {
            font-size: 0.875rem;
            font-family: monospace;
          }
  
          .copy-button {
            font-size: 0.875rem;
            padding: 4px 8px;
            background: #404040;
            color: #e0e0e0;
            border: 1px solid #505050;
            border-radius: 4px;
            cursor: pointer;
          }
  
          .code-block {
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 0.9rem;
            padding: 1rem;
            overflow-x: auto;
          }
  
          .hljs { background: #1e1e1e; color: #e0e0e0; }
          .hljs-keyword { color: #ff79c6; font-weight: bold; }
          .hljs-string { color: #f1fa8c; }
          .hljs-number { color: #bd93f9; }
          .hljs-comment { color: #6272a4; font-style: italic; }
          .hljs-function { color: #50fa7b; }
          .hljs-title { color: #8be9fd; }
        </style>
        ${formattedContent}
      </div>
    `);
  }
}
