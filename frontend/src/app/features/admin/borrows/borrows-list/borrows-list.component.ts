import { Component, OnInit, ViewChild, Inject } from '@angular/core';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { BorrowService, BorrowDuration } from '../../../../core/services/borrow.service';
import { Borrow } from '../../../../core/models/borrow.model';
import { BorrowFormComponent } from '../borrow-form/borrow-form.component';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

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
    MatDialogModule,
    ReactiveFormsModule
  ],
  templateUrl: './borrows-list.component.html'
})
export class BorrowsListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'regno', 'email', 'book', 'dueDate', 'status'];
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
    const dialogRef = this.dialog.open(AdminRenewBookDialogComponent, {
      width: '400px',
      data: { bookTitle: item.book?.title || '', dueDate: item.dueDate }
    });

    dialogRef.afterClosed().subscribe(duration => {
      if (duration) {
        this.borrows.renewBook(item.id, duration).subscribe({
          next: () => { this.toastr.success('Borrow renewed'); this.load(); },
          error: () => this.toastr.error('Failed to renew')
        });
      }
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

// Admin Renew Book Dialog Component
@Component({
  selector: 'app-admin-renew-book-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Renew Borrow</h2>
      <p class="text-gray-600 mb-4">Extend the due date for <strong>{{data.bookTitle}}</strong></p>
      
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Select Renewal Duration</mat-label>
        <mat-select [formControl]="durationControl">
          <mat-option [value]="BorrowDuration.THREE_DAYS">3 Days</mat-option>
          <mat-option [value]="BorrowDuration.FIVE_DAYS">5 Days</mat-option>
          <mat-option [value]="BorrowDuration.ONE_WEEK">1 Week</mat-option>
          <mat-option [value]="BorrowDuration.TWO_WEEKS">2 Weeks</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="mt-4 text-sm text-gray-600">
        <p>Current due date: {{data.dueDate | date:'medium'}}</p>
        <p class="font-semibold text-blue-600 mt-2">New due date will be current due date + selected duration</p>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="confirm()" [disabled]="!durationControl.value">
          Confirm Renewal
        </button>
      </div>
    </div>
  `
})
export class AdminRenewBookDialogComponent {
  BorrowDuration = BorrowDuration;
  durationControl = new FormControl(BorrowDuration.TWO_WEEKS);

  constructor(
    public dialogRef: MatDialogRef<AdminRenewBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirm() {
    this.dialogRef.close(this.durationControl.value);
  }
}
