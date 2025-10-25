import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatsListComponent } from './seats-list.component';

describe('SeatsListComponent', () => {
  let component: SeatsListComponent;
  let fixture: ComponentFixture<SeatsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
