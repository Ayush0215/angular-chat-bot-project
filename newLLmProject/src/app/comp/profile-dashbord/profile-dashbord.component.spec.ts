import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDashbordComponent } from './profile-dashbord.component';

describe('ProfileDashbordComponent', () => {
  let component: ProfileDashbordComponent;
  let fixture: ComponentFixture<ProfileDashbordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDashbordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileDashbordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
