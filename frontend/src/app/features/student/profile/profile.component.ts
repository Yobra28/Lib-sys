import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <h1 class="text-2xl font-semibold text-slate-800 mb-4">My Profile</h1>
      <mat-card>
        <mat-card-content class="pt-4">
          <form [formGroup]="form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
<input matInput formControlName="email" [disabled]="true" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Reg. No</mat-label>
              <input matInput formControlName="regno" />
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">Save Changes</button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  form: FormGroup;
  saving = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private toastr: ToastrService) {
    const u = this.auth.currentUserValue!;
    this.form = this.fb.group({
      firstName: [u?.firstName || '', Validators.required],
      lastName: [u?.lastName || '', Validators.required],
      email: [u?.email || ''],
      phone: [u?.phone || ''],
      regno: [(u as any)?.regno || '']
    });
  }

  ngOnInit() {}

  save() {
    this.saving = true;
    const { firstName, lastName, phone, regno } = this.form.value;
    this.auth.updateProfile({ firstName, lastName, phone, regno } as any).subscribe({
      next: () => { this.toastr.success('Profile updated'); this.saving = false; },
      error: () => { this.toastr.error('Failed to update'); this.saving = false; }
    });
  }
}
