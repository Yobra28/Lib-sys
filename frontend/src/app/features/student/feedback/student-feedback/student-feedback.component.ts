import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { FeedbackService, Feedback } from '../../../../core/services/feedback.service';

@Component({
  selector: 'app-student-feedback',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatPaginatorModule
  ],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Feedback / Book Request</h1>
      
      <!-- Two Column Layout -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Left Column: Feedback Form -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Submit Feedback</mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <form [formGroup]="form" class="space-y-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Subject</mat-label>
                <input matInput formControlName="subject" placeholder="Feedback subject">
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Message</mat-label>
                <textarea matInput rows="6" formControlName="message" placeholder="Share your feedback or request a book..."></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || loading" class="w-full">
                <mat-icon>send</mat-icon>
                Submit Feedback
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Right Column: Recent Feedbacks -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Feedback</mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-2">
            <div *ngIf="paginatedItems.length > 0; else none" class="space-y-3">
              <div *ngFor="let f of paginatedItems" class="border-b border-slate-100 pb-3 last:border-0">
                <div class="flex items-start justify-between mb-2">
                  <div class="font-medium text-slate-800">{{f.subject}}</div>
                  <span class="text-xs text-slate-500">{{f.createdAt | date:'short'}}</span>
                </div>
                <div class="text-sm text-slate-600 whitespace-pre-line mb-2">{{f.message}}</div>
                <div *ngIf="f.response" class="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div class="text-xs font-semibold text-amber-800 mb-1 flex items-center">
                    <mat-icon class="mr-1 text-amber-600" style="width: 16px; height: 16px; font-size: 16px;">reply</mat-icon>
                    Admin Response
                  </div>
                  <div class="text-sm text-slate-700 whitespace-pre-line">{{f.response}}</div>
                  <div class="text-xs text-slate-500 mt-1" *ngIf="f.updatedAt">{{f.updatedAt | date:'short'}}</div>
                </div>
              </div>

              <!-- Pagination -->
              <mat-paginator 
                *ngIf="items.length > pageSize"
                [length]="items.length"
                [pageSize]="pageSize"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onPageChange($event)"
                [pageIndex]="currentPage">
              </mat-paginator>
            </div>
            <ng-template #none>
              <div class="text-slate-500 py-8 text-center">
                <mat-icon class="text-slate-300 text-6xl">feedback</mat-icon>
                <p class="mt-4">No feedback yet</p>
                <p class="text-sm">Submit your first feedback using the form on the left</p>
              </div>
            </ng-template>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `
})
export class StudentFeedbackComponent implements OnInit {
  form: FormGroup;
  loading = false;
  items: Feedback[] = [];
  currentPage = 0;
  pageSize = 5;
  paginatedItems: Feedback[] = [];

  constructor(private fb: FormBuilder, private feedback: FeedbackService, private toastr: ToastrService) {
    this.form = this.fb.group({ subject: ['', Validators.required], message: ['', Validators.required] });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.feedback.getMyFeedback().subscribe({ 
      next: (rows) => {
        this.items = rows;
        this.updatePaginatedItems();
      }
    });
  }

  updatePaginatedItems() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.items.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedItems();
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.feedback.create(this.form.value).subscribe({
      next: () => { 
        this.toastr.success('Feedback submitted successfully'); 
        this.form.reset(); 
        this.loading = false; 
        this.currentPage = 0; // Reset to first page
        this.load(); 
      },
      error: () => { 
        this.toastr.error('Failed to submit feedback'); 
        this.loading = false; 
      }
    });
  }
}
