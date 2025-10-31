import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService, Notification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reminder-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-slate-800">Reminder Logs</h1>
      </div>

      <mat-card class="card p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Title, message, email...">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select [(value)]="selectedType" (selectionChange)="filterByType()">
              <mat-option [value]="''">All</mat-option>
              <mat-option value="DUE_REMINDER">Due Reminder (Tomorrow)</mat-option>
              <mat-option value="DUE_REMINDER_5H">Due Reminder (5h)</mat-option>
              <mat-option value="OVERDUE">Overdue</mat-option>
              <mat-option value="SEAT_REMINDER">Seat Reminder</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <table mat-table [dataSource]="dataSource" matSort class="w-full">
          <ng-container matColumnDef="sentAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Sent At</th>
            <td mat-cell *matCellDef="let n">{{n.sentAt | date:'medium'}}</td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
            <td mat-cell *matCellDef="let n">{{n.type}}</td>
          </ng-container>

          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let n">{{n.user?.firstName}} {{n.user?.lastName}}<div class="text-xs text-slate-500">{{n.user?.email}}</div></td>
          </ng-container>

          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let n">{{n.title}}</td>
          </ng-container>

          <ng-container matColumnDef="message">
            <th mat-header-cell *matHeaderCellDef>Message</th>
            <td mat-cell *matCellDef="let n">{{n.message}}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div *ngIf="!loading && dataSource.data.length === 0" class="text-center text-slate-500 py-10">
          <mat-icon class="text-6xl text-slate-300">notifications_paused</mat-icon>
          <p class="mt-2">No reminder notifications have been sent.</p>
        </div>

        <mat-paginator [pageSizeOptions]="[10,20,50]" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `
})
export class ReminderLogsComponent implements OnInit {
  displayedColumns: string[] = ['sentAt', 'type', 'user', 'title', 'message'];
  dataSource = new MatTableDataSource<Notification>([]);
  loading = false;
  selectedType = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private notifications: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  load() {
    this.loading = true;
    this.notifications.getAll().subscribe({
      next: (rows) => {
        const reminderTypes = new Set(['DUE_REMINDER','DUE_REMINDER_5H','OVERDUE','SEAT_REMINDER']);
        const filtered = (rows || []).filter(n => reminderTypes.has(n.type));
        this.dataSource.data = filtered;
        this.loading = false;
      },
      error: () => { this.loading = false; this.dataSource.data = []; }
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  filterByType() {
    this.dataSource.filterPredicate = (data, filter) => data.type === filter || filter === '';
    this.dataSource.filter = this.selectedType;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }
}


