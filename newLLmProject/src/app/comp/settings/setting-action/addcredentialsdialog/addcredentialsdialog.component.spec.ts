import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddcredentialsdialogComponent } from './addcredentialsdialog.component';

describe('AddcredentialsdialogComponent', () => {
  let component: AddcredentialsdialogComponent;
  let fixture: ComponentFixture<AddcredentialsdialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddcredentialsdialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddcredentialsdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
