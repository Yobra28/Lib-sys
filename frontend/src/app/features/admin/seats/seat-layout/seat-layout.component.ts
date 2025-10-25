import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SeatService } from '../../../../core/services/seat.service';
import { Seat } from '../../../../core/models/seat.model';

@Component({
  selector: 'app-seat-layout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './seat-layout.component.html'
})
export class SeatLayoutComponent implements OnInit {
  seats: Seat[] = [];
  floorControl = new FormControl(1);
  sectionControl = new FormControl('all');
  sections: string[] = [];

  constructor(private seatService: SeatService) {}

  ngOnInit() {
    this.loadSeats();
    this.loadSections();
    
    this.floorControl.valueChanges.subscribe(() => this.loadSeats());
    this.sectionControl.valueChanges.subscribe(() => this.loadSeats());
  }

  loadSeats() {
    const floor = this.floorControl.value || undefined;
    const section = this.sectionControl.value === 'all' ? undefined : this.sectionControl.value || undefined;
    
    this.seatService.getAll(floor, section).subscribe({
      next: (seats) => {
        this.seats = seats;
      }
    });
  }

  loadSections() {
    this.seatService.getSections().subscribe({
      next: (sections) => {
        this.sections = sections;
      }
    });
  }

  getSeatClass(seat: Seat): string {
    switch (seat.status) {
      case 'AVAILABLE':
        return 'bg-green-200 hover:bg-green-300';
      case 'RESERVED':
        return 'bg-red-200';
      case 'OCCUPIED':
        return 'bg-orange-200';
      case 'MAINTENANCE':
        return 'bg-gray-200';
      default:
        return 'bg-blue-200';
    }
  }
}
