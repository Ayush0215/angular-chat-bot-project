import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { GroqLlmService } from './groq-llm.service'; // Adjust the path to your service file

describe('GroqLlmService', () => {
  let service: GroqLlmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule], // Import HttpClientModule here
      providers: [GroqLlmService], // Provide the service you're testing
    });

    service = TestBed.inject(GroqLlmService); // Inject the service
  });

  it('should be created', () => {
    expect(service).toBeTruthy(); // Check that the service is created
  });
});
