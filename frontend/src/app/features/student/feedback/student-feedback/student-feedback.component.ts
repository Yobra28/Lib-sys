import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Feedback / Book Request</h1>
      <mat-card class="mb-6">
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
            <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || loading">
              Submit
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content class="pt-2">
          <h2 class="text-xl font-semibold mb-3">My Feedback</h2>
          <mat-list *ngIf="items.length; else none">
            <mat-list-item *ngFor="let f of items" class="border-b border-slate-100">
              <div matListItemTitle class="font-medium">{{f.subject}}</div>
              <div matListItemLine class="text-sm text-slate-600 whitespace-pre-line">{{f.message}}</div>
              <div class="mt-2 w-full" *ngIf="f.response">
                <div class="text-xs uppercase text-slate-500 mb-1 flex items-center"><mat-icon class="mr-1 text-amber-500">reply</mat-icon> Response</div>
                <div class="text-sm text-slate-700 whitespace-pre-line">{{f.response}}</div>
              </div>
              <div matListItemMeta class="text-xs text-slate-500">{{f.updatedAt || f.createdAt | date:'short'}}</div>
            </mat-list-item>
          </mat-list>
          <ng-template #none>
            <div class="text-slate-500 py-8 text-center">No feedback yet.</div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class StudentFeedbackComponent implements OnInit {
  form: FormGroup;
  loading = false;
  items: Feedback[] = [];

  constructor(private fb: FormBuilder, private feedback: FeedbackService, private toastr: ToastrService) {
    this.form = this.fb.group({ subject: ['', Validators.required], message: ['', Validators.required] });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.feedback.getMyFeedback().subscribe({ next: (rows) => (this.items = rows) });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.feedback.create(this.form.value).subscribe({
      next: () => { this.toastr.success('Feedback submitted'); this.form.reset(); this.loading = false; this.load(); },
      error: () => { this.toastr.error('Failed to submit'); this.loading = false; }
    });
  }
}
