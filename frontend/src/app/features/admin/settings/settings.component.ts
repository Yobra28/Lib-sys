import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SettingsService, SystemSettings } from '../../../core/services/settings.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
  <div class="p-6 space-y-4">
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
      <div class="page-actions">
        <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || loading">
          <mat-icon>save</mat-icon> Save
        </button>
      </div>
    </div>

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Library Name</mat-label>
            <input matInput formControlName="libraryName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fine Rate Per Day</mat-label>
            <input matInput type="number" formControlName="fineRatePerDay" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Borrow Limit</mat-label>
            <input matInput type="number" formControlName="borrowLimit" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Reservation Limit</mat-label>
            <input matInput type="number" formControlName="reservationLimit" />
          </mat-form-field>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="card">
      <mat-card-content>
        <h2 class="text-lg font-semibold mb-3">Raw Settings</h2>
        <table mat-table [dataSource]="entries" class="w-full">
          <ng-container matColumnDef="key">
            <th mat-header-cell *matHeaderCellDef>Key</th>
            <td mat-cell *matCellDef="let row">{{row.key}}</td>
          </ng-container>
          <ng-container matColumnDef="value">
            <th mat-header-cell *matHeaderCellDef>Value</th>
            <td mat-cell *matCellDef="let row">{{row.value | json}}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['key','value']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['key','value'];"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  </div>
  `
})
export class SettingsComponent implements OnInit {
  loading = false;
  data: SystemSettings = {};
  entries: { key: string; value: any }[] = [];
  form: FormGroup;

  constructor(private settings: SettingsService, fb: FormBuilder, private toastr: ToastrService) {
    this.form = fb.group({
      libraryName: [''],
      fineRatePerDay: [null],
      borrowLimit: [null],
      reservationLimit: [null]
    });
  }

  ngOnInit() {
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.settings.get().subscribe({
      next: (res) => {
        this.data = res || {};
        this.entries = Object.keys(this.data).map(k => ({ key: k, value: (this.data as any)[k] }));
        this.form.patchValue({
          libraryName: (this.data as any).libraryName ?? 'Smart Library',
          fineRatePerDay: (this.data as any).fineRatePerDay ?? 0,
          borrowLimit: (this.data as any).borrowLimit ?? 3,
          reservationLimit: (this.data as any).reservationLimit ?? 1
        });
        this.loading = false;
      },
      error: () => { 
        // Use defaults when API is not available
        this.data = { libraryName: 'Smart Library', fineRatePerDay: 0, borrowLimit: 3, reservationLimit: 1 };
        this.entries = Object.keys(this.data).map(k => ({ key: k, value: (this.data as any)[k] }));
        this.form.patchValue(this.data);
        this.loading = false;
      }
    });
  }

  save() {
    this.loading = true;
    const payload = { ...this.data, ...this.form.value } as any;
    this.settings.update(payload).subscribe({
      next: (res) => { 
        this.toastr.success('Settings saved');
        this.data = res;
        this.fetch();
      },
      error: (err) => { 
        // If API isn't available yet, just store locally and inform the user
        if (err?.status === 404) {
          this.toastr.info('Backend settings API not found. Using local values for now.');
          this.data = payload;
          this.entries = Object.keys(this.data).map(k => ({ key: k, value: (this.data as any)[k] }));
          this.loading = false;
          return;
        }
        this.loading = false; 
        this.toastr.error('Failed to save settings'); 
      }
    });
  }
}