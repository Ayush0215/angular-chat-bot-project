import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingActionComponent } from './setting-action.component';

describe('SettingActionComponent', () => {
  let component: SettingActionComponent;
  let fixture: ComponentFixture<SettingActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
