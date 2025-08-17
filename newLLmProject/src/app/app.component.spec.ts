import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ɵresetCompiledComponents,
} from '@angular/core'; // To ignore unknown HTML elements in templates
import { GroqLlmService } from './service/groq-llm.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Import this
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientModule, BrowserAnimationsModule], // Use declarations instead of imports
      schemas: [CUSTOM_ELEMENTS_SCHEMA], // Prevent errors for unknown elements
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy(); // Check if the app instance is created
  });

  it(`should have the 'ChatBot AI' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    // Ensure the title property is defined in the AppComponent
    expect(app.title).toEqual('ChatBot AI');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // Trigger change detection

    const compiled = fixture.nativeElement as HTMLElement;

    // Check for an h1 element and ensure it contains the expected text
    expect(compiled.querySelector('h1')?.textContent).toContain('ChatBot AI');
  });
});
