import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatOnComponent } from './chat-on.component';

describe('ChatOnComponent', () => {
  let component: ChatOnComponent;
  let fixture: ComponentFixture<ChatOnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatOnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatOnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
