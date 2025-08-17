import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuilderProfileComponent } from './builder-profile.component';

describe('BuilderProfileComponent', () => {
  let component: BuilderProfileComponent;
  let fixture: ComponentFixture<BuilderProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuilderProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuilderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
