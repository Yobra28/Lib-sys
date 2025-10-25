import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BorrowDuration } from '../../../../core/services/borrow.service';
import { Book } from '../../../../core/models/book.model';

export interface BorrowDurationOption {
  value: BorrowDuration;
  label: string;
  days: number;
}

@Component({
  selector: 'app-borrow-duration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="p-6">
      <h2 mat-dialog-title class="text-xl font-bold mb-4">Select Borrow Duration</h2>
      
      <mat-dialog-content>
        <div class="mb-4">
          <mat-card class="mb-4">
            <mat-card-content class="flex items-center gap-4">
              <mat-icon class="text-blue-500">book</mat-icon>
              <div>
                <h3 class="font-semibold">{{data.book.title}}</h3>
                <p class="text-sm text-gray-600">{{data.book.author}}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="mb-4">
          <h3 class="font-semibold mb-3">Choose how long you want to borrow this book:</h3>
          <div class="grid grid-cols-2 gap-3">
            <button 
              *ngFor="let duration of data.durations"
              mat-raised-button
              [color]="selectedDuration === duration.value ? 'primary' : 'basic'"
              (click)="selectDuration(duration.value)"
              class="h-16 flex flex-col justify-center">
              <span class="font-semibold">{{duration.label}}</span>
              <span class="text-xs opacity-75">{{duration.days}} days</span>
            </button>
          </div>
        </div>

        <div *ngIf="selectedDuration" class="bg-blue-50 p-4 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <mat-icon class="text-blue-500">info</mat-icon>
            <span class="font-semibold text-blue-800">Important Information</span>
          </div>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>• Due date will be calculated from today</li>
            <li>• Fine of ₹50 per day if returned late</li>
            <li>• You must pay any fines before returning the book</li>
            <li>• Book must be returned in good condition</li>
          </ul>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="flex justify-end gap-2">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="!selectedDuration"
          (click)="onConfirm()">
          Borrow Book
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class BorrowDurationDialogComponent {
  selectedDuration: BorrowDuration | null = null;

  constructor(
    public dialogRef: MatDialogRef<BorrowDurationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      book: Book; 
      durations: BorrowDurationOption[] 
    }
  ) {}

  selectDuration(duration: BorrowDuration) {
    this.selectedDuration = duration;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.selectedDuration) {
      this.dialogRef.close({ duration: this.selectedDuration });
    }
  }
}
