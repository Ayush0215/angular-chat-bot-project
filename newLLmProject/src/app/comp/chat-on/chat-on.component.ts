import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../service/chat-on.service';
import { LlmConversationService } from '../../service/llm-conversation.service';
import { MatIconModule } from '@angular/material/icon';
import {
  animate,
  trigger,
  state,
  transition,
  style,
} from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import hljs from 'highlight.js';

interface groupConversation {
  id: string;
  messages: Conversation[];
}

@Component({
  selector: 'app-chat-on',
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './chat-on.component.html',
  styleUrl: './chat-on.component.css',
  animations: [
    trigger('showButtonAnimation', [
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'translateY(0)',
        })
      ),
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'translateY(50px)',
        })
      ),
      transition('visible <=> hidden', animate('300ms ease-in-out')),
    ]),
  ],
})
export class ChatOnComponent implements OnInit, AfterViewInit {
  conversations: Conversation[] = [];
  groupedConversations: groupConversation[] = [];
  currentIndex: string = '';
  showArrowButton: boolean = true;
  loading = false;
  error: string | null = null;

  //Pagination variables
  private page = 1;
  private readonly limit = 10;
  public hasMoreData = true;
  private isScrolling = false;

  constructor(
    private chatOnService: LlmConversationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) {
    this.TextFormatter = new TextFormatter(sanitizer);
  }
  ngOnInit(): void {
    this.chatOnService.currentIndex$.subscribe((index) => {
      if (index) {
        this.currentIndex = index;
        this.conversations = [];
        this.groupedConversations = [];
        this.page = 1;
        this.hasMoreData = true;
        this.loadConversation(); // Trigger conversation loading
      }
    });
  }

  loadConversation(): void {
    if (!this.currentIndex || this.loading || !this.hasMoreData) return;

    this.loading = true;
    this.error = null;

    this.chatOnService
      .getConversation(
        this.currentIndex,
        this.limit,
        (this.page - 1) * this.limit
      )
      .subscribe({
        next: (response) => {
          const { data, has_more } = response;
          this.hasMoreData = has_more; // Directly set from API response

          if (data.length > 0) {
            this.conversations.push(...data);
            this.groupConversations();
          }

          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load conversation: ' + error.message;
          this.loading = false;
        },
      });
  }
  onScroll(): void {
    if (this.isScrolling || this.loading || !this.hasMoreData) return;

    const container = this.conversationContainer.nativeElement;
    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) <=
      threshold;

    if (isNearBottom) {
      this.isScrolling = true;
      this.page++;
      this.loadConversation();

      setTimeout(() => {
        this.isScrolling = false;
      }, 500);
    }
  }

  private groupConversations(): void {
    const groupedMap = new Map<string, Conversation[]>();

    this.conversations.forEach((message) => {
      if (!groupedMap.has(message.conversation_id)) {
        groupedMap.set(message.conversation_id, []);
      }

      const existingMessages = groupedMap.get(message.conversation_id);
      // Check if message already exists in the group
      if (
        !existingMessages?.some(
          (m) => m.message_index === message.message_index
        )
      ) {
        existingMessages?.push(message);
      }
    });

    this.groupedConversations = Array.from(groupedMap.entries()).map(
      ([id, messages]) => ({
        id,
        messages: messages.sort((a, b) => {
          // Sort by timestamp, ascending order (oldest first, latest last)
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }),
      })
    );

    // Sort conversations by the timestamp of the first message (ascending order)
    this.groupedConversations.sort((a, b) => {
      const aTime = new Date(a.messages[0].timestamp).getTime();
      const bTime = new Date(b.messages[0].timestamp).getTime();
      return bTime - aTime;
    });
  }

  @ViewChild('conversationContainer', { static: false })
  conversationContainer!: ElementRef;
  ngAfterViewInit(): void {
    this.renderer.listen(
      this.conversationContainer.nativeElement,
      'scroll',
      () => this.onScroll()
    );

    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.copy-button') as HTMLButtonElement | null;
      if (!button) return;

      const code = button.getAttribute('data-code');
      if (!code) return;

      // Decode HTML entities
      const textArea = document.createElement('textarea');
      textArea.innerHTML = code;
      const decodedCode = textArea.value;

      // Copy to Clipboard
      navigator.clipboard
        .writeText(decodedCode)
        .then(() => {
          console.log('Copied to clipboard');

          // Update innerHTML for the copied state
          button.innerHTML = `
          <svg width="19" height="19" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21 7L9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7z"/>
          </svg> Copied!
        `;

          // Use Renderer2 to apply inline styles
          this.renderer.setStyle(button, 'fontSize', '16px');
          this.renderer.setStyle(button, 'padding', '8px 12px');
          this.renderer.setStyle(button, 'minWidth', '90px');

          // Force Angular to detect changes if needed
          this.cdr.detectChanges();

          // Revert back after 2 seconds
          setTimeout(() => {
            button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
            </svg> Copy
          `;
            // Remove inline styles using Renderer2
            this.renderer.removeStyle(button, 'fontSize');
            this.renderer.removeStyle(button, 'padding');
            this.renderer.removeStyle(button, 'minWidth');
            this.cdr.detectChanges();
          }, 2000);
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    });
  }

  scrollToBottom() {
    // Ensure conversationContainer is available
    if (this.conversationContainer) {
      const container = this.conversationContainer.nativeElement;

      // Scroll to the bottom
      container.scrollTop = container.scrollHeight;
    }
  }
  private TextFormatter: TextFormatter;
  formatResponse(content: string) {
    return this.TextFormatter.formatResponse(content);
  }
}
interface TextBlockStyles {
  container: string;
  heading: string;
  paragraph: string;
  list: string;
  listItem: string;
  emphasis: string;
  strong: string;
  subHeading: string;
  blockquote: string;
}
interface CodeBlockStyles {
  container: string;
  header: string;
  languageLabel: string;
  copyButton: string;
  preBlock: string;
  codeContent: string;
  lineNumbers: string;
}
interface ContentBlock {
  type: 'text' | 'code';
  content: string;
  language?: string;
}
export class TextFormatter {
  private readonly textStyles: TextBlockStyles;
  private readonly codeStyles: CodeBlockStyles;
  constructor(private sanitizer: DomSanitizer) {
    this.textStyles = {
      container: [
        'border-radius:12px;',

        'box-shadow:0 1px 3px rgba(0,0,0,0.05);',
      ].join(''),
      heading: [
        'font-size:1.5rem;',
        'font-weight:600;',
        'color:var(--text-color);',

        'padding-bottom:0.5rem;',
        'border-bottom:1px solid #f0f0f0;',
        'font-family:"Inter", system-ui, -apple-system, sans-serif;',
      ].join(''),
      paragraph: [
        'line-height:1.7;',
        'color:var(--text-color);',
        'font-size:1rem;',
        'font-family:"Inter", system-ui, -apple-system, sans-serif;',
      ].join(''),
      list: ['padding-left:1.5rem;', 'position:relative;'].join(''),
      listItem: [
        'padding-left:1rem;',
        'position:relative;',
        'color:var(--text-color);',
        '&::before:{content:"•";color:#718096;position:absolute;left:0;}',
      ].join(''),
      emphasis: [
        'font-style:italic;',
        'color:var(--text-color);',
        'background-color:#f8fafc;',
        'padding:0.1rem 0.3rem;',
        'border-radius:4px;',
      ].join(''),
      strong: [
        'font-weight:600;',
        'color:var(--text-color);',
        'padding:0.1rem 0.3rem;',
        'border-radius:4px;',
      ].join(''),
      blockquote: [
        'border-left:3px solid #e2e8f0;',

        'padding:0.5rem 1rem;',
        'color:var(--text-color);',
        'font-style:italic;',
      ].join(''),
      subHeading: [
        'font-size:1.2rem;',
        'font-weight:500;',
        'color:var(--text-color);',
      ].join(''),
    };
    this.codeStyles = {
      container: [
        'border-radius:8px;',
        'margin:1.5rem 0;',
        'background:#1e1e1e;',
        'box-shadow:0 2px 8px rgba(0,0,0,0.1);',
        'border:1px solid #2d2d2d;',
      ].join(''),
      header: [
        'display:flex;',
        'justify-content:space-between;',
        'align-items:center;',
        'padding:0.75rem 1rem;',
        'background:#252526;',
        'border-radius:8px 8px 0 0;',
        'border-bottom:1px solid #373737;',
      ].join(''),
      languageLabel: [
        'font-family:"Fira Code", monospace;',
        'font-size:0.85rem;',
        'color:white !important;',
        'letter-spacing:0.5px;',
      ].join(''),
      copyButton: [
        'color:white !important;',
        'border:none;',
        'border-radius:4px;',
        'padding:0.35rem 1rem;',
        'cursor:pointer;',
        'font-size:0.85rem;',
        'transition:all 0.2s ease;',
        'display:flex;',
        'align-items:center;',
        'gap:0.5rem;',
        '&:hover:{background:#4a4a4a;}',
        '&:active:{transform:scale(0.98);}',
      ].join(''),
      preBlock: [
        'margin:0;',
        'padding:1.25rem;',
        'overflow-x:auto;',
        'scroll-behavior: smooth;',
        'background:#1e1e1e;',
        'border-radius:0 0 8px 8px;',
      ].join(''),
      codeContent: [
        'font-family:"Fira Code", monospace;',
        'font-size:0.9rem;',
        'line-height:1.6;',
        'color:white !important;',
        'tab-size:2;',
      ].join(''),
      lineNumbers: [
        'padding: 0 1rem;',
        'user-select: none;',
        'color: #5a5a5a !important',
        'text-aling: right',
        'background:#252526',
        'border-right: 1px solid #373737',
      ].join(''),
    };
  }
  public formatResponse(content: string): SafeHtml {
    const blocks = this.separateBlocks(content);
    const processedContent = blocks
      .map((block) => {
        return block.type === 'code'
          ? this.processCodeBlock(block.content, block.language ?? 'plaintext')
          : this.processTextBlock(block.content);
      })
      .join('\n');
    return this.sanitizer.bypassSecurityTrustHtml(`
      <article style="width:92%;margin:0 auto;padding: 1rem 15px; border-radius: 15px;">
        ${processedContent}
      </article>
    `);
  }
  private separateBlocks(content: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const codePattern = /```(\S*)\s*([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codePattern.exec(content)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({
          type: 'text',
          content: content.slice(lastIndex, match.index).trim(),
        });
      }
      blocks.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      blocks.push({
        type: 'text',
        content: content.slice(lastIndex).trim(),
      });
    }
    return blocks;
  }
  private processTextBlock(text: string): string {
    // Clean input and preserve meaningful punctuation
    const cleanedText = text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[&]/g, '&amp;') // Encode ampersands
      .replace(/["]/g, '&quot;') // Encode quotes
      .replace(/\n{2,}/g, '\n')
      .replace(/[=-]/g, '  ')
      .replace(/[*]/g, '')
      .trim();
    return `
      <section style="${this.textStyles.container}">
        ${this.processTextContent(cleanedText)}
      </section>
    `;
  }
  private processTextContent(text: string): string {
    let listBuffer: { items: string[]; isOrdered: boolean } | null = null;
    const processedLines: string[] = [];
    const noteMatch = text.match(/^Note that (.+)/i);
    if (noteMatch) {
      return `<div style="${this.textStyles.blockquote}">
        <strong style="${this.textStyles.strong}">Note:</strong>
        ${noteMatch[1]}
      </div>`;
    }
    const closeListBuffer = () => {
      if (listBuffer) {
        const listTag = listBuffer.isOrdered ? 'ol' : 'ul';
        processedLines.push(
          `<${listTag} style="${this.textStyles.list}">${listBuffer.items.join(
            ''
          )}</${listTag}>`
        );
        listBuffer = null;
      }
    };
    text.split('\n').forEach((line) => {
      line = line.trim();
      let processedLine = '';
      // Existing heading/blockquote processing
      if (/^## /.test(line)) {
        processedLine = `<h2 style="${this.textStyles.heading}">${line.replace(
          '## ',
          ''
        )}</h2>`;
      } else if (/^### /.test(line)) {
        processedLine = `<h3 style="${
          this.textStyles.subHeading
        }">${line.replace('### ', '')}</h3>`;
      } else if (/^> /.test(line)) {
        processedLine = `<blockquote style="${
          this.textStyles.blockquote
        }">${line.replace('> ', '')}</blockquote>`;
      }
      // List detection
      else if (/^\d+\.\s/.test(line)) {
        if (!listBuffer || !listBuffer.isOrdered) {
          closeListBuffer();
          listBuffer = { items: [], isOrdered: true };
        }
        listBuffer.items.push(
          `<li style="${this.textStyles.listItem}">${line.replace(
            /^\d+\.\s/,
            ''
          )}</li>`
        );
      } else if (/^-\s/.test(line)) {
        if (!listBuffer || listBuffer.isOrdered) {
          closeListBuffer();
          listBuffer = { items: [], isOrdered: false };
        }
        listBuffer.items.push(
          `<li style="${this.textStyles.listItem}">${line.replace(
            /^-\s/,
            ''
          )}</li>`
        );
      }
      // Non-list content
      else {
        closeListBuffer();
        // Existing inline element processing
        processedLine = line
          .replace(
            /\*\*(.+?)\*\*/g,
            `<strong style="${this.textStyles.strong}">$1</strong>`
          )
          .replace(
            /\*(.+?)\*/g,
            `<em style="${this.textStyles.emphasis}">$1</em>`
          )
          .replace(/`(.+?)`/g, '<code>$1</code>');
        processedLine = `<p style="${this.textStyles.paragraph}">${processedLine}</p>`;
      }
      if (processedLine) {
        processedLines.push(processedLine);
      }
    });
    closeListBuffer(); // Close any remaining list buffer
    return processedLines.join('\n');
  }
  private processCodeBlock(code: string, language: string): string {
    const { lines, formattedCode } = this.prepareCode(code);
    const highlighted = this.highlightCode(formattedCode, language);
    return `
    <div style="${this.codeStyles.container} color: white;">
      ${this.createHeader(language, code)}
      <pre style="${this.codeStyles.preBlock}">
        <div class="code-container" style="display: flex;">
          ${this.createLineNumbers(lines)}
          <code style="${this.codeStyles.codeContent}">${highlighted}</code>
        </div>
      </pre>
    </div>
  `;
  }
  private createLineNumbers(lines: string[]): string {
    return lines.length > 1
      ? `<div style= "${this.codeStyles.lineNumbers}">${lines
          .map((_, i) => i + 1)
          .join('<br>')}</div> `
      : '';
  }
  private prepareCode(code: string): {
    lines: string[];
    formattedCode: string;
  } {
    const cleaned = code
      .replace(/\t/g, '  ') // Convert tabs to spaces
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim();
    const lines = cleaned.split('\n');
    return { lines, formattedCode: cleaned };
  }
  private highlightCode(code: string, language: string): string {
    try {
      const validLang = hljs.getLanguage(language) ? language : 'plaintext';
      return hljs.highlight(code, { language: validLang }).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  }
  private createHeader(language: string, rawCode: string): string {
    const escapedCode = this.escapeHtml(rawCode);
    return `
      <div style="${this.codeStyles.header}">
        <span style="${this.codeStyles.languageLabel}">
          ${language || 'plaintext'}
        </span>
       <button
        style="${this.codeStyles.copyButton}"
        data-code="${escapedCode}"
        class="copy-button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
        </svg>
        
      </button>
      </div>
    `;
  }
  private removeSpecialCharacters(text: string): string {
    return text
      .replace(/[^\w\s.,!?-_]/g, '')
      .replace(/[.]/g, '<br>')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;')
      .replace(/\n/g, '&#13;');
  }
}
