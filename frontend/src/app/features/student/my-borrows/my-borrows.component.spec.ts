import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyBorrowsComponent } from './my-borrows/my-borrows.component';

describe('MyBorrowsComponent', () => {
  let component: MyBorrowsComponent;
  let fixture: ComponentFixture<MyBorrowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBorrowsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyBorrowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
