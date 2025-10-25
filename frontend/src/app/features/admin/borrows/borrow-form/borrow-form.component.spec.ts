import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BorrowFormComponent } from './borrow-form.component';

describe('BorrowFormComponent', () => {
  let component: BorrowFormComponent;
  let fixture: ComponentFixture<BorrowFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BorrowFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BorrowFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
