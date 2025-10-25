import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { BorrowService } from '../../../../core/services/borrow.service';
import { Borrow } from '../../../../core/models/borrow.model';
import { BorrowFormComponent } from '../borrow-form/borrow-form.component';

@Component({
  selector: 'app-borrows-list',
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
    MatSelectModule,
    MatDialogModule
  ],
  templateUrl: './borrows-list.component.html'
})
export class BorrowsListComponent implements OnInit {
  displayedColumns: string[] = ['user', 'book', 'borrowedAt', 'dueDate', 'status', 'actions'];
  dataSource = new MatTableDataSource<Borrow>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private borrows: BorrowService, private toastr: ToastrService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  load() {
    this.loading = true;
    this.borrows.getAll().subscribe({
      next: (rows: any) => {
        // Accept either flat Borrow[] or objects with user/book populated
        this.dataSource.data = rows as Borrow[];
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load borrow records');
        this.loading = false;
      }
    });
  }

  markReturned(item: Borrow) {
    this.borrows.returnBook(item.id).subscribe({
      next: () => { this.toastr.success('Book marked as returned'); this.load(); },
      error: () => this.toastr.error('Failed to mark as returned')
    });
  }

  renew(item: Borrow) {
    this.borrows.renewBook(item.id).subscribe({
      next: () => { this.toastr.success('Borrow renewed'); this.load(); },
      error: () => this.toastr.error('Failed to renew')
    });
  }

  issueBook() {
    this.dialog.open(BorrowFormComponent, { width: '520px' })
      .afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  displayUser(row: any): string {
    const u = row.user;
    return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
  }

  displayBook(row: any): string {
    return row.book?.title || '';
  }
}
