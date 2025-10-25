import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div class="w-full max-w-3xl">
        <div class="card p-8">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white flex items-center justify-center mb-4">
              <mat-icon class="!text-3xl">person_add</mat-icon>
            </div>
            <h1 class="text-2xl font-semibold text-slate-800">Create Account</h1>
            <p class="text-sm text-slate-500 mt-1">Join our library system to manage your borrowing and reservations</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error>First name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error>Last name is required</mat-error>
              </mat-form-field>

              <mat-form-field class="md:col-span-2" appearance="outline">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" formControlName="email">
                <mat-icon matPrefix>email</mat-icon>
                <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" placeholder="+254712345678">
                <mat-icon matPrefix>phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Address</mat-label>
                <input matInput formControlName="address">
                <mat-icon matPrefix>location_on</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error>Password must be at least 6 characters</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Confirm Password</mat-label>
                <input matInput [type]="hideConfirmPassword ? 'password' : 'text'" formControlName="confirmPassword">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword = !hideConfirmPassword">
                  <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">Confirm password is required</mat-error>
                <mat-error *ngIf="registerForm.hasError('passwordMismatch')">Passwords do not match</mat-error>
              </mat-form-field>
            </div>

            <div class="mt-3 text-sm text-slate-600">
              <label class="inline-flex items-center gap-2">
                <input type="checkbox" formControlName="acceptTerms" class="rounded border-slate-300">
                I agree to the <a class="text-primary-600 hover:text-primary-700" href="#">Terms and Conditions</a> and <a class="text-primary-600 hover:text-primary-700" href="#">Privacy Policy</a>
              </label>
              <div class="text-xs text-slate-500 mt-1" *ngIf="registerForm.get('acceptTerms')?.invalid && registerForm.get('acceptTerms')?.touched">You must accept the terms to continue.</div>
            </div>

            <button type="submit" [disabled]="registerForm.invalid || loading" 
                    class="w-full h-12 mt-4 rounded-md text-white bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-800 hover:to-primary-600 transition">
              <span *ngIf="!loading">Create Account</span>
              <mat-icon *ngIf="loading" class="animate-spin align-middle">refresh</mat-icon>
            </button>
          </form>

          <div class="mt-6 text-center text-sm">
            <span class="text-slate-600">Already have an account?</span>
            <a routerLink="/auth/login" class="ml-1 text-primary-600 hover:text-primary-800 font-semibold">Sign in here</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value 
      ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      const { confirmPassword, ...data } = this.registerForm.value;
      
      this.authService.register(data).subscribe({
        next: () => {
          this.toastr.success('Registration successful!');
          this.router.navigate(['/student/dashboard']);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }
}