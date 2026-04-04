import { Component, inject } from '@angular/core';
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
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

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
    MatIconModule,
    ThemeToggleComponent,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

    :host { display: block; font-family: 'DM Sans', sans-serif; }

    /* ── Root layout ── */
    .reg-root {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      background: #0a0a0f;
    }

    /* ── Left panel ── */
    .panel-left {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2.5rem;
      padding: 3rem;
      background: linear-gradient(145deg, #0f0c29 0%, #302b63 55%, #1a1a3e 100%);
    }

    .panel-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 55% at 20% 10%, rgba(139,92,246,.4) 0%, transparent 65%),
        radial-gradient(ellipse 55% 55% at 85% 85%, rgba(59,130,246,.28) 0%, transparent 60%);
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: .55;
      animation: drift 9s ease-in-out infinite alternate;
    }
    .orb-1 { width: 300px; height: 300px; background: #7c3aed; top: -50px; left: -70px; animation-delay: 0s; }
    .orb-2 { width: 200px; height: 200px; background: #2563eb; bottom: 60px; right: -50px; animation-delay: 3s; }
    .orb-3 { width: 140px; height: 140px; background: #06b6d4; top: 45%; left: 55%; animation-delay: 1.5s; }

    @keyframes drift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(25px, 18px) scale(1.07); }
    }

    /* top logo area */
    .brand-logo {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .75rem;
      width: 100%;
    }
    .logo-icon {
      width: 42px; height: 42px;
      border-radius: 12px;
      background: rgba(255,255,255,.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
    }
    .logo-icon mat-icon { color: #fff; font-size: 22px !important; width: 22px !important; height: 22px !important; }
    .logo-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.15rem;
      color: rgba(255,255,255,.85);
    }

    /* headline + steps */
    .panel-copy {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 28rem;
    }

    .panel-headline {
      font-family: 'Playfair Display', serif;
      font-size: 2.6rem;
      line-height: 1.1;
      color: #fff;
      margin: 0 0 1rem;
      text-align: center;
    }
    .panel-headline em {
      font-style: normal;
      background: linear-gradient(90deg, #a78bfa, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .panel-sub {
      font-size: .9rem;
      color: rgba(255,255,255,.45);
      line-height: 1.75;
      max-width: 320px;
      margin: 0 auto;
      text-align: center;
    }

    .steps {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .9rem;
      width: 100%;
    }
    .step {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .85rem;
      width: 100%;
    }
    .step-dot {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: rgba(139,92,246,.25);
      border: 1px solid rgba(139,92,246,.5);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .step-dot mat-icon { color: #a78bfa; font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .step-text { font-size: .82rem; color: rgba(255,255,255,.45); }

    /* ── Right form panel ── */
    .panel-right {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 3rem 2.5rem;
      background: #0e0e16;
      overflow-y: auto;
    }

    .form-shell {
      width: 100%;
      max-width: 520px;
      animation: fadeUp .5s ease both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .form-header { margin-bottom: 2rem; }
    .form-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.9rem;
      color: #f1f0ff;
      margin: 0 0 .35rem;
    }
    .form-sub { font-size: .85rem; color: rgba(255,255,255,.35); }

    /* ── Grid ── */
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .col-span-2 { grid-column: span 2; }

    /* ── Field ── */
    .field-wrap { display: flex; flex-direction: column; }
    .field-label {
      font-size: .7rem;
      font-weight: 500;
      letter-spacing: .09em;
      text-transform: uppercase;
      color: rgba(255,255,255,.38);
      margin-bottom: .45rem;
    }
    .field-inner { position: relative; display: flex; align-items: center; }

    .field-icon {
      position: absolute;
      left: 13px;
      color: rgba(255,255,255,.28);
      font-size: 17px !important;
      width: 17px !important;
      height: 17px !important;
      pointer-events: none;
      z-index: 1;
    }

    .field-input {
      width: 100%;
      height: 48px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 11px;
      color: #f1f0ff;
      font-family: 'DM Sans', sans-serif;
      font-size: .9rem;
      padding: 0 44px 0 40px;
      outline: none;
      transition: border-color .2s, background .2s, box-shadow .2s;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: rgba(255,255,255,.18); }
    .field-input:focus {
      border-color: rgba(139,92,246,.65);
      background: rgba(139,92,246,.06);
      box-shadow: 0 0 0 3px rgba(139,92,246,.13);
    }
    .field-input.ng-invalid.ng-touched {
      border-color: rgba(248,113,113,.55);
      box-shadow: 0 0 0 3px rgba(248,113,113,.08);
    }

    .field-error {
      font-size: .72rem;
      color: #f87171;
      margin-top: .3rem;
      padding-left: 2px;
    }

    .suffix-btn {
      position: absolute;
      right: 9px;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,.28);
      display: flex; align-items: center; justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: color .2s;
    }
    .suffix-btn:hover { color: rgba(255,255,255,.6); }
    .suffix-btn mat-icon { font-size: 17px !important; width: 17px !important; height: 17px !important; }

    /* ── Terms ── */
    .terms-row {
      margin-top: 1.1rem;
    }
    .terms-label {
      display: flex;
      align-items: flex-start;
      gap: .6rem;
      font-size: .82rem;
      color: rgba(255,255,255,.38);
      cursor: pointer;
      line-height: 1.5;
    }
    .terms-label input[type="checkbox"] {
      margin-top: 2px;
      width: 15px; height: 15px;
      accent-color: #7c3aed;
      flex-shrink: 0;
      cursor: pointer;
    }
    .terms-link {
      color: #a78bfa;
      text-decoration: none;
      transition: color .2s;
    }
    .terms-link:hover { color: #c4b5fd; }
    .terms-error { font-size: .72rem; color: #f87171; margin-top: .3rem; }

    /* ── Submit ── */
    .submit-btn {
      width: 100%;
      height: 50px;
      margin-top: 1.5rem;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: .98rem;
      font-weight: 500;
      letter-spacing: .03em;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      box-shadow: 0 4px 22px rgba(124,58,237,.33);
      transition: opacity .2s, transform .15s, box-shadow .2s;
    }
    .submit-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.1) 0%, transparent 60%);
      opacity: 0; transition: opacity .2s;
    }
    .submit-btn:hover:not(:disabled)::before { opacity: 1; }
    .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(124,58,237,.42); }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: .45; cursor: not-allowed; }

    .spin { animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ── */
    .form-footer {
      margin-top: 1.5rem;
      text-align: center;
      font-size: .83rem;
      color: rgba(255,255,255,.3);
    }
    .login-link {
      color: #a78bfa;
      text-decoration: none;
      font-weight: 500;
      margin-left: .25rem;
      transition: color .2s;
    }
    .login-link:hover { color: #c4b5fd; }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .reg-root { grid-template-columns: 1fr; }
      .panel-left { display: none; }
      .fields-grid { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
    }

    .auth-theme-corner {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 100;
    }

    html:not(.dark) .reg-root {
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #faf5ff 100%);
    }
    html:not(.dark) .panel-left {
      background: linear-gradient(145deg, #e0e7ff 0%, #ddd6fe 50%, #e9d5ff 100%);
    }
    html:not(.dark) .panel-headline { color: #0f172a; }
    html:not(.dark) .panel-headline em {
      -webkit-text-fill-color: #5b21b6;
      background: none;
    }
    html:not(.dark) .panel-sub { color: #475569; }
    html:not(.dark) .step-text { color: #334155; }
    html:not(.dark) .panel-right { background: transparent; }
    html:not(.dark) .form-shell {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 24px 64px rgba(15, 23, 42, 0.08);
    }
    html:not(.dark) .form-title { color: #0f172a; }
    html:not(.dark) .form-sub { color: #64748b; }
    html:not(.dark) .field-label { color: #334155; }
    html:not(.dark) .field-input {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #0f172a;
    }
    html:not(.dark) .field-input::placeholder { color: #94a3b8; }
    html:not(.dark) .field-input:focus {
      border-color: rgba(124, 58, 237, 0.45);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
    }
    html:not(.dark) .field-icon { color: #64748b !important; }
    html:not(.dark) .form-footer { color: #64748b; }
    html:not(.dark) .login-link { color: #6d28d9; }
    html:not(.dark) .login-link:hover { color: #5b21b6; }
  `],
  template: `
    <div class="reg-root">
      <div class="auth-theme-corner">
        <app-theme-toggle [inverted]="theme.isDark()" />
      </div>

      <!-- ── Left Panel ── -->
      <div class="panel-left">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>

        <div class="brand-logo">
          <div class="logo-icon"><mat-icon>auto_stories</mat-icon></div>
          <span class="logo-name">LibraryOS</span>
        </div>

        <div class="panel-copy">
          <h2 class="panel-headline">Start your<br><em>journey</em> today.</h2>
          <p class="panel-sub">Create your account in seconds and unlock a smarter borrowing experience.</p>

          <div class="steps">
            <div class="step">
              <div class="step-dot"><mat-icon>person_outline</mat-icon></div>
              <span class="step-text">Fill in your personal details</span>
            </div>
            <div class="step">
              <div class="step-dot"><mat-icon>verified_user</mat-icon></div>
              <span class="step-text">Verify your student registration</span>
            </div>
            <div class="step">
              <div class="step-dot"><mat-icon>menu_book</mat-icon></div>
              <span class="step-text">Borrow, reserve &amp; track books</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right Panel ── -->
      <div class="panel-right">
        <div class="form-shell">

          <div class="form-header">
            <h1 class="form-title">Create account</h1>
            <p class="form-sub">Join the library system — it only takes a minute</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="fields-grid">

              <!-- First Name -->
              <div class="field-wrap">
                <label class="field-label">First Name</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">person_outline</mat-icon>
                  <input class="field-input" formControlName="firstName" placeholder="Jane" />
                </div>
                <div class="field-error"
                     *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched">
                  First name is required
                </div>
              </div>

              <!-- Last Name -->
              <div class="field-wrap">
                <label class="field-label">Last Name</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">person_outline</mat-icon>
                  <input class="field-input" formControlName="lastName" placeholder="Doe" />
                </div>
                <div class="field-error"
                     *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched">
                  Last name is required
                </div>
              </div>

              <!-- Email -->
              <div class="field-wrap col-span-2">
                <label class="field-label">Email Address</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">alternate_email</mat-icon>
                  <input class="field-input" type="email" formControlName="email"
                         placeholder="you@example.com" autocomplete="email" />
                </div>
                <div class="field-error"
                     *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                  <span *ngIf="registerForm.get('email')?.hasError('required')">Email is required</span>
                  <span *ngIf="registerForm.get('email')?.hasError('email')">Please enter a valid email</span>
                </div>
              </div>

              <!-- Phone -->
              <div class="field-wrap">
                <label class="field-label">Phone</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">phone_outline</mat-icon>
                  <input class="field-input" formControlName="phone" placeholder="+254712345678" />
                </div>
              </div>

              <!-- Reg No -->
              <div class="field-wrap">
                <label class="field-label">Reg. No</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">badge</mat-icon>
                  <input class="field-input" formControlName="regno" placeholder="CUC/1234/20" />
                </div>
              </div>

              <!-- Password -->
              <div class="field-wrap">
                <label class="field-label">Password</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">lock_outline</mat-icon>
                  <input class="field-input"
                         [type]="hidePassword ? 'password' : 'text'"
                         formControlName="password"
                         placeholder="••••••••"
                         autocomplete="new-password" />
                  <button class="suffix-btn" type="button" (click)="hidePassword = !hidePassword">
                    <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                <div class="field-error"
                     *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                  Password must be at least 6 characters
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="field-wrap">
                <label class="field-label">Confirm Password</label>
                <div class="field-inner">
                  <mat-icon class="field-icon">lock_outline</mat-icon>
                  <input class="field-input"
                         [type]="hideConfirmPassword ? 'password' : 'text'"
                         formControlName="confirmPassword"
                         placeholder="••••••••"
                         autocomplete="new-password" />
                  <button class="suffix-btn" type="button" (click)="hideConfirmPassword = !hideConfirmPassword">
                    <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                <div class="field-error"
                     *ngIf="registerForm.get('confirmPassword')?.touched">
                  <span *ngIf="registerForm.get('confirmPassword')?.hasError('required')">Confirm password is required</span>
                  <span *ngIf="registerForm.hasError('passwordMismatch') && !registerForm.get('confirmPassword')?.hasError('required')">Passwords do not match</span>
                </div>
              </div>

            </div>

            <!-- Terms -->
            <div class="terms-row">
              <label class="terms-label">
                <input type="checkbox" formControlName="acceptTerms" />
                I agree to the
                <a class="terms-link" href="#">Terms and Conditions</a>
                and
                <a class="terms-link" href="#">Privacy Policy</a>
              </label>
              <div class="terms-error"
                   *ngIf="registerForm.get('acceptTerms')?.invalid && registerForm.get('acceptTerms')?.touched">
                You must accept the terms to continue.
              </div>
            </div>

            <!-- Submit -->
            <button class="submit-btn" type="submit" [disabled]="registerForm.invalid || loading">
              <mat-icon *ngIf="loading" class="spin">refresh</mat-icon>
              <span *ngIf="!loading">Create Account</span>
              <mat-icon *ngIf="!loading" style="font-size:17px;width:17px;height:17px;">arrow_forward</mat-icon>
            </button>
          </form>

          <p class="form-footer">
            Already have an account?
            <a routerLink="/auth/login" class="login-link">Sign in here</a>
          </p>

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
  readonly theme = inject(ThemeService);

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
      regno: [''],
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