import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingCComponent } from './loading-c.component';

describe('LoadingCComponent', () => {
  let component: LoadingCComponent;
  let fixture: ComponentFixture<LoadingCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingCComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
