import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
    MatPaginatorModule,
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
  pageIndex = 0;
  pageSize = 10;
  pagedFeedback: any[] = [];

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
        this.updatePagedFeedback();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updatePagedFeedback() {
    const start = this.pageIndex * this.pageSize;
    this.pagedFeedback = this.allFeedback.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedFeedback();
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
