import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { FineService } from '../../../../core/services/fine.service';
import { Fine } from '../../../../core/models/fine.model';

@Component({
  selector: 'app-my-fines',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">My Fines</h1>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <mat-card>
          <mat-card-content class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Total Fines</p>
              <p class="text-3xl font-bold text-red-600">\${{totalFines}}</p>
            </div>
            <mat-icon class="text-5xl text-red-200">attach_money</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Pending Fines</p>
              <p class="text-3xl font-bold text-orange-600">\${{pendingFines}}</p>
            </div>
            <mat-icon class="text-5xl text-orange-200">warning</mat-icon>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Paid Fines</p>
              <p class="text-3xl font-bold text-green-600">\${{paidFines}}</p>
            </div>
            <mat-icon class="text-5xl text-green-200">check_circle</mat-icon>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Fines List -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Fine History</mat-card-title>
        </mat-card-header>
        <mat-card-content class="pt-4">
          <div *ngIf="loading" class="flex justify-center py-10">
            <mat-spinner></mat-spinner>
          </div>

          <div *ngIf="!loading && fines.length === 0" class="text-center py-10">
            <mat-icon class="text-green-300 text-8xl">check_circle</mat-icon>
            <h2 class="text-2xl text-gray-600 mt-4">No fines!</h2>
            <p class="text-gray-500 mt-2">Keep up the good work!</p>
          </div>

          <table mat-table [dataSource]="fines" *ngIf="!loading && fines.length > 0" class="w-full">
            <!-- Book Column -->
            <ng-container matColumnDef="book">
              <th mat-header-cell *matHeaderCellDef>Book</th>
              <td mat-cell *matCellDef="let fine">
                <div>
                  <p class="font-semibold">{{fine.borrow?.book?.title}}</p>
                  <p class="text-sm text-gray-600">{{fine.borrow?.book?.author}}</p>
                </div>
              </td>
            </ng-container>

            <!-- Reason Column -->
            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Reason</th>
              <td mat-cell *matCellDef="let fine">{{fine.reason}}</td>
            </ng-container>

            <!-- Amount Column -->
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let fine">
                <span class="text-red-600 font-semibold">\${{fine.amount}}</span>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let fine">{{fine.createdAt | date}}</td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let fine">
                <mat-chip-set>
                  <mat-chip [class]="getStatusClass(fine.status)">
                    {{fine.status}}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let fine">
                <button mat-raised-button color="primary" 
                        *ngIf="fine.status === 'PENDING'"
                        size="small">
                  Contact Admin
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Payment Info -->
      <mat-card class="mt-6" *ngIf="pendingFines > 0">
        <mat-card-content>
          <div class="flex items-start gap-4">
            <mat-icon class="text-orange-500 text-4xl">info</mat-icon>
            <div class="flex-1">
              <h3 class="font-semibold text-lg mb-2">Payment Required</h3>
              <p class="text-gray-600 mb-4">
                You have <span class="font-semibold text-orange-600">\${{pendingFines}}</span> in pending fines. 
                Please contact the library admin to arrange payment.
              </p>
              <button mat-raised-button color="accent">
                <mat-icon>email</mat-icon>
                Contact Library
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class MyFinesComponent implements OnInit {
  fines: any[] = [];
  loading = false;
  totalFines = 0;
  pendingFines = 0;
  paidFines = 0;

  displayedColumns = ['book', 'reason', 'amount', 'date', 'status', 'actions'];

  constructor(
    private fineService: FineService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadMyFines();
  }

  loadMyFines() {
    this.loading = true;
    this.fineService.getMyFines().subscribe({
      next: (fines) => {
        this.fines = fines;
        this.calculateTotals();
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load fines');
        this.loading = false;
      }
    });
  }


  calculateTotals() {
    this.totalFines = this.fines.reduce((sum, fine) => sum + fine.amount, 0);
    this.paidFines = (this.fines || [])
      .filter((f: any) => f.status === 'PAID')
      .reduce((sum: number, fine: any) => sum + fine.amount, 0);
    this.pendingFines = (this.fines || [])
      .filter((f: any) => f.status === 'PENDING')
      .reduce((sum: number, fine: any) => sum + fine.amount, 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-700';
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'WAIVED':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}