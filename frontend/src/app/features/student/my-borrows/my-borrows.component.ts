import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { BorrowService } from '../../../core/services/borrow.service';
import { Borrow, Fine } from '../../../core/models/borrow.model';

@Component({
  selector: 'app-my-borrows',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">My Borrowed Books</h1>

      <!-- Loading Spinner -->
      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <mat-spinner></mat-spinner>
      </div>

      <!-- Borrows List -->
      <div *ngIf="!loading && borrows.length > 0" class="space-y-4">
        <mat-card *ngFor="let borrow of borrows" class="hover:shadow-lg transition">
          <mat-card-content class="p-6">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-4 mb-4">
                  <mat-icon class="text-blue-500 text-4xl">book</mat-icon>
                  <div>
                    <h3 class="text-xl font-bold">{{borrow.book?.title}}</h3>
                    <p class="text-gray-600">{{borrow.book?.author}}</p>
                    <p class="text-sm text-gray-500">ISBN: {{borrow.book?.isbn}}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p class="text-sm text-gray-500">Borrowed Date</p>
                    <p class="font-semibold">{{borrow.borrowDate | date:'medium'}}</p>
                </div>
                      <div>
                    <p class="text-sm text-gray-500">Due Date</p>
                    <p class="font-semibold" [class.text-red-600]="isOverdue(borrow)">
                      {{borrow.dueDate | date:'medium'}}
                    </p>
                      </div>
                  <div>
                    <p class="text-sm text-gray-500">Status</p>
                    <mat-chip-set>
                      <mat-chip [class]="getStatusClass(borrow.status)">
                        {{borrow.status}}
                      </mat-chip>
                    </mat-chip-set>
              </div>
                </div>

                <!-- Fine Information -->
                <div *ngIf="borrow.fines && borrow.fines.length > 0" class="bg-red-50 p-4 rounded-lg mb-4">
                  <div class="flex items-center gap-2 mb-2">
                    <mat-icon class="text-red-500">warning</mat-icon>
                    <span class="font-semibold text-red-800">Outstanding Fines</span>
                  </div>
                  <div *ngFor="let fine of borrow.fines" class="flex justify-between items-center">
                      <div>
                      <p class="text-sm text-red-700">{{fine.reason}}</p>
                      <p class="text-xs text-red-600">Created: {{fine.createdAt | date:'short'}}</p>
                      </div>
                    <div class="text-right">
                      <p class="font-bold text-red-800">₹{{fine.amount}}</p>
                      <mat-chip-set>
                        <mat-chip [class]="getFineStatusClass(fine.status)">
                          {{fine.status}}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                  </div>
                </div>

                <!-- Overdue Warning -->
                <div *ngIf="isOverdue(borrow) && (!borrow.fines || borrow.fines.length === 0)" 
                     class="bg-orange-50 p-4 rounded-lg mb-4">
                  <div class="flex items-center gap-2 mb-2">
                    <mat-icon class="text-orange-500">schedule</mat-icon>
                    <span class="font-semibold text-orange-800">Overdue Notice</span>
                  </div>
                  <p class="text-sm text-orange-700">
                    This book is overdue. A fine will be calculated when you return it.
                    Current fine rate: ₹50 per day.
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col gap-2 ml-4">
                <button 
                  *ngIf="borrow.status === 'ACTIVE' && !hasPendingFines(borrow)"
                  mat-raised-button 
                  color="primary"
                  (click)="returnBook(borrow)">
                  <mat-icon>keyboard_return</mat-icon>
                  Return Book
                </button>
                
                <button 
                  *ngIf="hasPendingFines(borrow)"
                  mat-raised-button 
                  color="warn"
                  (click)="payFines(borrow)">
                  <mat-icon>payment</mat-icon>
                  Pay Fines
                </button>

                <button 
                  *ngIf="borrow.status === 'ACTIVE'"
                  mat-button
                  (click)="renewBook(borrow)">
                  <mat-icon>refresh</mat-icon>
                  Renew
                </button>
              </div>
            </div>
        </mat-card-content>
      </mat-card>
      </div>

      <!-- No Borrows -->
      <div *ngIf="!loading && borrows.length === 0" class="text-center py-20">
        <mat-icon class="text-gray-300 text-8xl">library_books</mat-icon>
        <h2 class="text-2xl text-gray-600 mt-4">No borrowed books</h2>
        <p class="text-gray-500 mt-2">You haven't borrowed any books yet</p>
      </div>
    </div>
  `
})
export class MyBorrowsComponent implements OnInit {
  borrows: Borrow[] = [];
  loading = false;

  constructor(
    private borrowService: BorrowService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadBorrows();
  }

  loadBorrows() {
    this.loading = true;
    this.borrowService.getMyBorrows().subscribe({
      next: (borrows: Borrow[]) => {
        this.borrows = borrows;
        this.loading = false;
      },
      error: (error: any) => {
        this.toastr.error('Failed to load borrowed books');
        this.loading = false;
      }
    });
  }

  isOverdue(borrow: Borrow): boolean {
    return new Date() > new Date(borrow.dueDate) && borrow.status !== 'RETURNED';
  }

  hasPendingFines(borrow: Borrow): boolean {
    return !!(borrow.fines && borrow.fines.length > 0 && 
           borrow.fines.some((fine: Fine) => fine.status === 'PENDING'));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'OVERDUE':
        return 'bg-red-100 text-red-700';
      case 'RETURNED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }

  getFineStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-red-100 text-red-700';
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'WAIVED':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  returnBook(borrow: Borrow) {
    if (confirm(`Are you sure you want to return "${borrow.book?.title}"?`)) {
    this.borrowService.returnBook(borrow.id).subscribe({
        next: () => {
          this.toastr.success('Book returned successfully');
          this.loadBorrows();
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to return book');
        }
    });
  }
}

  payFines(borrow: Borrow) {
    // Open fine payment dialog
    this.toastr.info('Fine payment feature coming soon');
  }

  renewBook(borrow: Borrow) {
    this.borrowService.renewBook(borrow.id).subscribe({
      next: () => {
        this.toastr.success('Book renewed successfully');
        this.loadBorrows();
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to renew book');
      }
    });
  }
}