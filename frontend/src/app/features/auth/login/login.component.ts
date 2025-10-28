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
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
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
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="w-full max-w-lg">
        <div class="card p-8">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-white flex items-center justify-center mb-4">
              <mat-icon class="!text-3xl">login</mat-icon>
            </div>
            <h1 class="text-2xl font-semibold text-slate-800">Welcome Back</h1>
            <p class="text-sm text-slate-500 mt-1">Sign in to manage your library operations</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4 mt-6">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="your.email@example.com">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <div class="flex items-center justify-between text-sm text-slate-600">
              <label class="inline-flex items-center gap-2">
                <input type="checkbox" class="rounded border-slate-300">
                Remember me
              </label>
              <a class="text-primary-600 hover:text-primary-700" href="#">Forgot password?</a>
            </div>

            <button type="submit" [disabled]="loginForm.invalid || loading" 
                    class="w-full h-12 rounded-md text-white bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-800 hover:to-primary-600 transition">
              <span *ngIf="!loading">Sign In</span>
              <mat-icon *ngIf="loading" class="animate-spin align-middle">refresh</mat-icon>
            </button>
          </form>

          <div class="mt-6 text-center text-sm">
            <span class="text-slate-600">Don't have an account?</span>
            <a routerLink="/auth/register" class="ml-1 text-primary-600 hover:text-primary-800 font-semibold">Create an account here</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.toastr.success('Login successful!');
          
          // Navigate based on role
          if (response.user.role === UserRole.ADMIN || response.user.role === UserRole.LIBRARIAN) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/student/dashboard']);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Login error:', error);
        }
      });
    }
  }
}
