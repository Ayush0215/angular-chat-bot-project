import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { LlmConversationService } from './llm-conversation.service';

describe('LlmConversationService', () => {
  let service: LlmConversationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [LlmConversationService],
    });
    service = TestBed.inject(LlmConversationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
