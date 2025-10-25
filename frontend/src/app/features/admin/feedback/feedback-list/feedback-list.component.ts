import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FeedbackService } from '../../../../core/services/feedback.service';

@Component({
  selector: 'app-feedback-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './feedback-list.component.html'
})
export class FeedbackListComponent implements OnInit {
  allFeedback: any[] = [];
  unreadFeedback: any[] = [];
  respondedFeedback: any[] = [];
  loading = false;

  constructor(
    private feedbackService: FeedbackService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadFeedback();
  }

  loadFeedback() {
    this.loading = true;
    this.feedbackService.getAll().subscribe({
      next: (feedback) => {
        this.allFeedback = feedback;
        this.unreadFeedback = feedback.filter(f => !f.isRead);
        this.respondedFeedback = feedback.filter(f => f.response);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  markAsRead(id: string) {
    this.feedbackService.markAsRead(id).subscribe({
      next: () => {
        this.loadFeedback();
      }
    });
  }

  respondToFeedback(feedbackId: string, responseText: string) {
    if (!responseText.trim()) {
      this.toastr.error('Please enter a response');
      return;
    }

    this.feedbackService.respond(feedbackId, responseText).subscribe({
      next: () => {
        this.toastr.success('Response sent');
        this.loadFeedback();
      }
    });
  }
}
