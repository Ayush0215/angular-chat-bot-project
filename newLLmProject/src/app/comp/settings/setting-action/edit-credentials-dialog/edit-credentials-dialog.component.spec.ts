import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCredentialsDialogComponent } from './edit-credentials-dialog.component';

describe('EditCredentialsDialogComponent', () => {
  let component: EditCredentialsDialogComponent;
  let fixture: ComponentFixture<EditCredentialsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCredentialsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCredentialsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
