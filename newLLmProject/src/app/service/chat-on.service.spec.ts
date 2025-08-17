import { TestBed } from '@angular/core/testing';

import { ChatOnService } from './chat-on.service';

describe('ChatOnService', () => {
  let service: ChatOnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatOnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
