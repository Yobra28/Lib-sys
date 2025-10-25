import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { SeatService } from '../../../../core/services/seat.service';
import { Seat } from '../../../../core/models/seat.model';
import { SeatFormComponent } from '../seat-form/seat-form.component';

@Component({
  selector: 'app-seats-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './seats-list.component.html'
})
export class SeatsListComponent implements OnInit {
  displayedColumns: string[] = ['seatNumber', 'floor', 'section', 'status', 'description', 'actions'];
  dataSource = new MatTableDataSource<Seat>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private seats: SeatService, private dialog: MatDialog, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  load() {
    this.loading = true;
    this.seats.getAll().subscribe({
      next: (rows) => { this.dataSource.data = rows as Seat[]; this.loading = false; },
      error: () => { this.toastr.error('Failed to load seats'); this.loading = false; }
    });
  }

  addSeat() {
    this.dialog.open(SeatFormComponent, { width: '480px' }).afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  editSeat(seat: Seat) {
    this.dialog.open(SeatFormComponent, { width: '480px', data: { seat } }).afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  deleteSeat(seat: Seat) {
    if (!confirm(`Delete seat ${seat.seatNumber}?`)) return;
    this.seats.delete(seat.id).subscribe({
      next: () => { this.toastr.success('Seat deleted'); this.load(); },
      error: () => this.toastr.error('Failed to delete seat')
    });
  }
}
