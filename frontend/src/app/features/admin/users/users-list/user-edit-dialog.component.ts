import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { User, UserService, UpdateUserDto } from '../../../../core/services/user.service';

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="p-6 max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Edit User</h2>
        <button mat-icon-button (click)="dialogRef.close()" [disabled]="loading">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" required>
            <mat-error *ngIf="form.get('firstName')?.hasError('required')">First name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" required>
            <mat-error *ngIf="form.get('lastName')?.hasError('required')">Last name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="md:col-span-2">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" required type="email">
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role" required>
              <mat-option value="ADMIN">Admin</mat-option>
              <mat-option value="LIBRARIAN">Librarian</mat-option>
              <mat-option value="STUDENT">Student</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('role')?.hasError('required')">Role is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="md:col-span-2">
            <mat-label>Reg. No</mat-label>
            <input matInput formControlName="regno">
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="isActive">Active</mat-checkbox>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <button mat-button type="button" (click)="dialogRef.close()" [disabled]="loading">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
            <mat-icon *ngIf="!loading">save</mat-icon>
            <span *ngIf="!loading">Save Changes</span>
            <mat-progress-spinner *ngIf="loading" diameter="20" mode="indeterminate"></mat-progress-spinner>
          </button>
        </div>
      </form>
    </div>
  `
})
export class UserEditDialogComponent {
  form: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<UserEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User,
    private fb: FormBuilder,
    private userService: UserService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      firstName: [user.firstName, [Validators.required]],
      lastName: [user.lastName, [Validators.required]],
      email: [user.email, [Validators.required, Validators.email]],
      phone: [user.phone ?? ''],
      regno: [(user as any).regno ?? ''],
      role: [user.role, [Validators.required]],
      isActive: [user.isActive]
    });
  }

  onSubmit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const payload: UpdateUserDto = this.form.value as UpdateUserDto;
    this.userService.update(this.user.id, payload).subscribe({
      next: (updated) => {
        this.toastr.success('User updated successfully');
        this.dialogRef.close(updated);
      },
      error: () => {
        this.toastr.error('Failed to update user');
        this.loading = false;
      }
    });
  }
}


