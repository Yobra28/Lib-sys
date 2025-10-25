import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { BorrowService } from '../../../../core/services/borrow.service';
import { Borrow } from '../../../../core/models/borrow.model';

@Component({
  selector: 'app-borrow-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './borrow-detail.component.html'
})
export class BorrowDetailComponent implements OnInit {
  borrow: Borrow | null = null;
  loading = true;

  constructor(
    private borrowService: BorrowService,
    public dialogRef: MatDialogRef<BorrowDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { borrowId: string }
  ) {}

  ngOnInit() {
    this.loadBorrowDetails();
  }

  loadBorrowDetails() {
    this.borrowService.getById(this.data.borrowId).subscribe({
      next: (borrow) => {
        this.borrow = borrow;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  isOverdue(): boolean {
    if (!this.borrow) return false;
    return new Date(this.borrow.dueDate) < new Date() && this.borrow.status !== 'RETURNED';
  }

  getDaysOverdue(): number {
    if (!this.borrow || !this.isOverdue()) return 0;
    const today = new Date();
    const due = new Date(this.borrow.dueDate);
    return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }

  close() {
    this.dialogRef.close();
  }
}