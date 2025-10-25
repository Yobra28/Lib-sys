import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { FineService } from '../../../../core/services/fine.service';
import { Fine } from '../../../../core/models/fine.model';

@Component({
  selector: 'app-fines-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './fines-list.component.html'
})
export class FinesListComponent implements OnInit {
  displayedColumns = ['user', 'book', 'amount', 'reason', 'date', 'status', 'actions'];
  dataSource!: MatTableDataSource<Fine>;
  totalPending = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fineService: FineService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<Fine>([]);
  }

  ngOnInit() {
    this.loadFines();
    this.loadTotalPending();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadFines() {
    this.fineService.getAll().subscribe({
      next: (fines) => {
        this.dataSource.data = fines;
      }
    });
  }

  loadTotalPending() {
    this.fineService.getTotalFines().subscribe({
      next: (data) => {
        this.totalPending = data.totalAmount;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  markAsPaid(id: string) {
    this.fineService.markAsPaid(id).subscribe({
      next: () => {
        this.toastr.success('Fine marked as paid');
        this.loadFines();
        this.loadTotalPending();
      }
    });
  }

  waiveFine(id: string) {
    if (confirm('Waive this fine?')) {
      this.fineService.waive(id, 'Waived by admin').subscribe({
        next: () => {
          this.toastr.success('Fine waived');
          this.loadFines();
          this.loadTotalPending();
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-orange-100 text-orange-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'WAIVED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}