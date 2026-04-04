import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { BorrowService, BorrowDuration, ReturnPaymentRequired, ReturnStatusResponse } from '../../../core/services/borrow.service';
import { Borrow, Fine } from '../../../core/models/borrow.model';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
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

                <!-- Renewal Info -->
                <div *ngIf="!canRenew(borrow).allowed && borrow.status === 'ACTIVE'" 
                     class="bg-amber-50 p-4 rounded-lg mb-4 border border-amber-200">
                  <div class="flex items-center gap-2 mb-2">
                    <mat-icon class="text-amber-500">info</mat-icon>
                    <span class="font-semibold text-amber-800">Renewal Available Soon</span>
                  </div>
                  <p class="text-sm text-amber-700">
                    You can renew this book 1 day before the due date. {{canRenew(borrow).message}}
                  </p>
                </div>

                <!-- Overdue Warning -->
                <div *ngIf="isOverdue(borrow) && (!borrow.fines || borrow.fines.length === 0)" 
                     class="bg-blue-50 p-4 rounded-lg mb-4">
                  <div class="flex items-center gap-2 mb-2">
                    <mat-icon class="text-blue-500">schedule</mat-icon>
                    <span class="font-semibold text-blue-800">Overdue - Pay via M-Pesa to return</span>
                  </div>
                  <p class="text-sm text-blue-700">
                    This book is overdue. When you return, you will pay the fine via M-Pesa (STK push) to complete the return.
                    Current fine rate: KES 1 per day. Pay via M-Pesa when you return.
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col gap-2 ml-4">
                <button 
                  *ngIf="borrow.status === 'ACTIVE'"
                  mat-raised-button 
                  [color]="(isOverdue(borrow) || hasPendingFines(borrow)) ? 'warn' : 'primary'"
                  (click)="returnBook(borrow)">
                  <mat-icon>keyboard_return</mat-icon>
                  {{(isOverdue(borrow) || hasPendingFines(borrow)) ? 'Return (Pay fine via M-Pesa)' : 'Return Book'}}
                </button>

                <button 
                  *ngIf="borrow.status === 'ACTIVE'"
                  mat-button
                  (click)="renewBook(borrow)"
                  [disabled]="!canRenew(borrow).allowed">
                  <mat-icon>refresh</mat-icon>
                  {{canRenew(borrow).allowed ? 'Renew' : 'Renew (Not Yet)'}}
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
    private dialog: MatDialog,
    private authService: AuthService
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
    const dialogRef = this.dialog.open(ReturnBookDialogComponent, {
      width: '420px',
      data: {
        bookTitle: borrow.book?.title,
        hasPossibleFine: this.isOverdue(borrow) || this.hasPendingFines(borrow),
      },
    });
    dialogRef.afterClosed().subscribe((payload: { phone?: string } | undefined) => {
      if (payload === undefined) return;
      this.borrowService.returnBook(borrow.id).subscribe({
        next: (response: any) => {
          if (response.requiresPayment && (response as ReturnPaymentRequired).checkoutRequestId) {
            const pay = response as ReturnPaymentRequired;
            this.toastr.info(pay.message, 'M-Pesa payment');
            this.dialog.open(ReturnPaymentPendingDialogComponent, {
              width: '400px',
              disableClose: true,
              data: { borrowId: borrow.id, amount: pay.amount, currency: pay.currency },
            }).afterClosed().subscribe(() => this.loadBorrows());
          } else {
            this.toastr.success('Book returned successfully');
            this.loadBorrows();
          }
        },
        error: (error: any) => {
          this.toastr.error(error.error?.message || 'Failed to return book');
        },
      });
    });
  }

  canRenew(borrow: Borrow): { allowed: boolean; message?: string; daysUntil?: number } {
    if (this.hasPendingFines(borrow)) {
      return { allowed: false, message: 'You have outstanding fines for this book. Please pay them before renewing.' };
    }

    if (borrow.status !== 'ACTIVE') {
      return { allowed: false, message: 'Only active borrows can be renewed' };
    }

    const now = new Date();
    const dueDate = new Date(borrow.dueDate);
    
    // Normalize to midnight for date-only comparison
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueDateDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const oneDayBeforeDueDate = dueDateDate - (24 * 60 * 60 * 1000);
    
    // Check if renewal is allowed (only on or 1 day before due date)
    if (nowDate < oneDayBeforeDueDate) {
      const daysUntilRenewalAllowed = Math.ceil((oneDayBeforeDueDate - nowDate) / (1000 * 60 * 60 * 24));
      const renewalDate = new Date(oneDayBeforeDueDate);
      return { 
        allowed: false, 
        message: `You can renew starting ${renewalDate.toLocaleDateString()}`,
        daysUntil: daysUntilRenewalAllowed
      };
    }

    return { allowed: true };
  }

  renewBook(borrow: Borrow) {
    const renewCheck = this.canRenew(borrow);
    
    if (!renewCheck.allowed) {
      this.toastr.warning(renewCheck.message || 'Renewal not allowed yet');
      return;
    }

    const dialogRef = this.dialog.open(RenewBookDialogComponent, {
      width: '400px',
      data: { bookTitle: borrow.book?.title, dueDate: borrow.dueDate }
    });

    dialogRef.afterClosed().subscribe(duration => {
      if (duration) {
        this.borrowService.renewBook(borrow.id, duration).subscribe({
      next: () => {
        this.toastr.success('Book renewed successfully');
        this.loadBorrows();
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to renew book');
      }
    });
      }
    });
  }
}

// Renew Book Dialog Component
@Component({
  selector: 'app-renew-book-dialog',
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
      <h2 class="text-xl font-bold mb-4">Renew Book</h2>
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
        <p class="font-semibold text-blue-600 mt-2">New due date will be {{data.dueDate | date:'medium'}} + selected duration</p>
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
export class RenewBookDialogComponent {
  BorrowDuration = BorrowDuration;
  durationControl = new FormControl(BorrowDuration.TWO_WEEKS);

  constructor(
    public dialogRef: MatDialogRef<RenewBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirm() {
    this.dialogRef.close(this.durationControl.value);
  }
}

// Return Book Dialog – uses profile phone for M-Pesa
@Component({
  selector: 'app-return-book-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Return book</h2>
      <p class="text-gray-600 mb-4">Return <strong>{{ data.bookTitle }}</strong>?</p>
      <p *ngIf="data.hasPossibleFine" class="text-sm text-amber-700 mb-4">
        This book may have a fine. We will send an M-Pesa STK push to the phone number saved in your profile to pay before completing the return.
      </p>
      <div class="flex justify-end gap-2 mt-4">
        <button mat-button (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="confirm()">Return book</button>
      </div>
    </div>
  `
})
export class ReturnBookDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReturnBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookTitle: string; hasPossibleFine: boolean }
  ) {}

  confirm() {
    this.dialogRef.close({});
  }
}

// Payment pending – poll until return completed or failed
@Component({
  selector: 'app-return-payment-pending-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="p-6 text-center">
      <h2 class="text-xl font-bold mb-2">Complete payment</h2>
      <p class="text-gray-600 mb-4">{{ amount }} {{ currency }} – Check your phone and enter your M-Pesa PIN.</p>
      <mat-spinner diameter="40" class="mx-auto mb-4" *ngIf="!error && !success"></mat-spinner>
      <p *ngIf="!error && !success" class="text-sm text-gray-500">Waiting for payment…</p>
      <p *ngIf="success" class="text-green-600 font-semibold">Return completed. You can close this.</p>
      <p *ngIf="error" class="text-red-600 font-semibold">{{ error }}</p>
      <button *ngIf="success || error" mat-raised-button (click)="dialogRef.close()">Close</button>
    </div>
  `
})
export class ReturnPaymentPendingDialogComponent implements OnInit, OnDestroy {
  amount = 0;
  currency = 'KES';
  success = false;
  error = '';
  private pollInterval: any;

  constructor(
    private borrowService: BorrowService,
    public dialogRef: MatDialogRef<ReturnPaymentPendingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { borrowId: string; amount: number; currency: string }
  ) {
    this.amount = data.amount;
    this.currency = data.currency || 'KES';
  }

  ngOnInit() {
    this.pollInterval = setInterval(() => this.check(), 3000);
    this.check();
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  check() {
    this.borrowService.getReturnStatus(this.data.borrowId).subscribe({
      next: (res: ReturnStatusResponse) => {
        if (res.returnStatus === 'returned') {
          this.success = true;
          if (this.pollInterval) clearInterval(this.pollInterval);
        } else if (res.paymentStatus === 'failed') {
          this.error = 'Payment cancelled / failed. Please try returning again.';
          if (this.pollInterval) clearInterval(this.pollInterval);
        }
      },
    });
  }
}