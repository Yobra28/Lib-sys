import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { ReservationService } from '../../../../core/services/reservation.service';
import { Reservation } from '../../../../core/models/reservation.model';

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './reservations-list.component.html'
})
export class ReservationsListComponent implements OnInit {
  displayedColumns = ['user', 'seat', 'date', 'time', 'status', 'actions'];
  dataSource!: MatTableDataSource<Reservation>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private reservationService: ReservationService,
    private toastr: ToastrService
  ) {
    this.dataSource = new MatTableDataSource<Reservation>([]);
  }

  ngOnInit() {
    this.loadReservations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadReservations() {
    this.reservationService.getAll().subscribe({
      next: (reservations) => {
        this.dataSource.data = reservations;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  approveReservation(id: string) {
    this.reservationService.approve(id).subscribe({
      next: () => {
        this.toastr.success('Reservation approved');
        this.loadReservations();
      }
    });
  }

  cancelReservation(id: string) {
    if (confirm('Cancel this reservation?')) {
      this.reservationService.cancel(id).subscribe({
        next: () => {
          this.toastr.success('Reservation cancelled');
          this.loadReservations();
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  }
}