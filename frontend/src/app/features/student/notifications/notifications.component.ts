import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule, MatIconModule, MatPaginatorModule],
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold text-slate-800">Notifications</h1>
        <button mat-button color="primary" (click)="markAll()"><mat-icon>done_all</mat-icon> Mark all as read</button>
      </div>

      <mat-card>
        <mat-card-content class="pt-2">
          <mat-list *ngIf="items.length > 0; else empty">
            <mat-list-item *ngFor="let n of paginatedItems" class="hover:bg-slate-50 rounded cursor-pointer" (click)="open(n)">
              <div matListItemTitle class="font-medium" [class.text-slate-400]="n.isRead">{{n.title}}</div>
              <div matListItemLine class="text-sm text-slate-600">{{n.message}}</div>
              <div matListItemMeta class="text-xs text-slate-500">{{n.sentAt | date:'short'}}</div>
              <button mat-icon-button (click)="markRead(n); $event.stopPropagation()" [disabled]="n.isRead" aria-label="Mark as read">
                <mat-icon>done</mat-icon>
              </button>
            </mat-list-item>
          </mat-list>

          <!-- Pagination -->
          <mat-paginator 
            *ngIf="items.length > pageSize"
            [length]="items.length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 20, 50]"
            (page)="onPageChange($event)"
            [pageIndex]="currentPage">
          </mat-paginator>

          <ng-template #empty>
            <div class="text-center py-16 text-slate-500">
              <mat-icon class="text-6xl text-slate-300">notifications_none</mat-icon>
              <p class="mt-3">You're all caught up!</p>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  items: Notification[] = [];
  currentPage = 0;
  pageSize = 5;
  paginatedItems: Notification[] = [];

  constructor(private svc: NotificationService, private toastr: ToastrService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.svc.getMyNotifications().subscribe({ 
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

  markRead(n: Notification) {
    this.svc.markAsRead(n.id).subscribe({ 
      next: () => { 
        n.isRead = true; 
        this.toastr.success('Marked as read');
        this.updatePaginatedItems();
      } 
    });
  }

  markAll() {
    this.svc.markAllAsRead().subscribe({ 
      next: () => { 
        this.items.forEach(i => i.isRead = true); 
        this.toastr.success('All marked as read');
        this.updatePaginatedItems();
      } 
    });
  }

  open(n: Notification) {
    // For now, all actionable notifications route students to their feedback page to view details
    if (!n.isRead) {
      this.svc.markAsRead(n.id).subscribe({ next: () => {
        n.isRead = true;
        this.updatePaginatedItems();
      }});
    }
    this.router.navigate(['/student/feedback']);
  }
}
