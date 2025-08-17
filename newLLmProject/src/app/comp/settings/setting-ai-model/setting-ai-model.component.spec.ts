import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingAIModelComponent } from './setting-ai-model.component';

describe('SettingAIModelComponent', () => {
  let component: SettingAIModelComponent;
  let fixture: ComponentFixture<SettingAIModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingAIModelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingAIModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
