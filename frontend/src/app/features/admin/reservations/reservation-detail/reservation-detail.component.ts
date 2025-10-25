import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ReservationService } from '../../../../core/services/reservation.service';
import { Reservation } from '../../../../core/models/reservation.model';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './reservation-detail.component.html'
})
export class ReservationDetailComponent implements OnInit {
  reservation: Reservation | null = null;
  loading = true;

  constructor(
    private reservationService: ReservationService,
    public dialogRef: MatDialogRef<ReservationDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reservationId: string }
  ) {}

  ngOnInit() {
    this.loadDetails();
  }

  loadDetails() {
    this.reservationService.getById(this.data.reservationId).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
