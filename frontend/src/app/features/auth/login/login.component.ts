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
import { UserRole } from '../../../core/models/user.model';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

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
    MatIconModule,
    ThemeToggleComponent,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

    :host {
      display: block;
      font-family: 'DM Sans', sans-serif;
    }

    .login-root {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #0a0a0f;
    }

    /* ── Left decorative panel ── */
    .panel-left {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 3rem;
      background: linear-gradient(145deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    }

    .panel-left::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 60% at 30% 20%, rgba(139,92,246,.35) 0%, transparent 65%),
        radial-gradient(ellipse 50% 50% at 80% 80%, rgba(59,130,246,.25) 0%, transparent 60%);
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: .6;
      animation: drift 8s ease-in-out infinite alternate;
    }
    .orb-1 { width: 320px; height: 320px; background: #7c3aed; top: -60px; left: -80px; animation-delay: 0s; }
    .orb-2 { width: 220px; height: 220px; background: #2563eb; bottom: 80px; right: -60px; animation-delay: 3s; }
    .orb-3 { width: 160px; height: 160px; background: #06b6d4; top: 40%; left: 50%; animation-delay: 1.5s; }

    @keyframes drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(30px, 20px) scale(1.08); }
    }

    .brand-mark {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 28rem;
    }

    .brand-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: rgba(255,255,255,.12);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,.18);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .brand-icon mat-icon {
      color: #fff;
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
    }

    .panel-headline {
      font-family: 'Playfair Display', serif;
      font-size: 3rem;
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
      font-size: .95rem;
      color: rgba(255,255,255,.55);
      line-height: 1.7;
      max-width: 320px;
      margin: 0 auto;
      text-align: center;
    }

    .panel-stats {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2rem 2.5rem;
      margin-top: 2.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .stat-num {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      color: #fff;
    }
    .stat-label { font-size: .75rem; color: rgba(255,255,255,.4); letter-spacing: .06em; text-transform: uppercase; }

    /* ── Right form panel ── */
    .panel-right {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      background: #0e0e16;
    }

    .form-shell {
      width: 100%;
      max-width: 420px;
      animation: fadeUp .5s ease both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .form-header { margin-bottom: 2.5rem; }

    .form-title {
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      color: #f1f0ff;
      margin: 0 0 .4rem;
    }

    .form-sub { font-size: .875rem; color: rgba(255,255,255,.38); }

    /* ── Custom fields ── */
    .field-wrap {
      margin-bottom: 1.25rem;
    }

    .field-label {
      display: block;
      font-size: .75rem;
      font-weight: 500;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: rgba(255,255,255,.45);
      margin-bottom: .5rem;
    }

    .field-inner {
      position: relative;
      display: flex;
      align-items: center;
    }

    .field-icon {
      position: absolute;
      left: 14px;
      color: rgba(255,255,255,.3);
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      pointer-events: none;
      z-index: 1;
    }

    .field-input {
      width: 100%;
      height: 52px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      color: #f1f0ff;
      font-family: 'DM Sans', sans-serif;
      font-size: .95rem;
      padding: 0 48px 0 44px;
      outline: none;
      transition: border-color .2s, background .2s, box-shadow .2s;
      box-sizing: border-box;
    }

    .field-input::placeholder { color: rgba(255,255,255,.2); }

    .field-input:focus {
      border-color: rgba(139,92,246,.7);
      background: rgba(139,92,246,.06);
      box-shadow: 0 0 0 3px rgba(139,92,246,.15);
    }

    .field-input.ng-invalid.ng-touched {
      border-color: rgba(248,113,113,.6);
      box-shadow: 0 0 0 3px rgba(248,113,113,.1);
    }

    .field-error {
      font-size: .75rem;
      color: #f87171;
      margin-top: .35rem;
      padding-left: 2px;
    }

    .suffix-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,.3);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: color .2s;
    }
    .suffix-btn:hover { color: rgba(255,255,255,.65); }
    .suffix-btn mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }

    /* ── Options row ── */
    .options-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
    }

    .remember-label {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-size: .825rem;
      color: rgba(255,255,255,.4);
      cursor: pointer;
    }

    .remember-label input[type="checkbox"] {
      width: 15px;
      height: 15px;
      accent-color: #7c3aed;
      cursor: pointer;
    }

    .forgot-link {
      font-size: .825rem;
      color: #a78bfa;
      text-decoration: none;
      transition: color .2s;
    }
    .forgot-link:hover { color: #c4b5fd; }

    /* ── Submit button ── */
    .submit-btn {
      width: 100%;
      height: 52px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: .03em;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: opacity .2s, transform .15s, box-shadow .2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .5rem;
      box-shadow: 0 4px 24px rgba(124,58,237,.35);
    }

    .submit-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.1) 0%, transparent 60%);
      opacity: 0;
      transition: opacity .2s;
    }

    .submit-btn:hover:not(:disabled)::before { opacity: 1; }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 32px rgba(124,58,237,.45);
    }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: .5; cursor: not-allowed; }

    .spin { animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ── */
    .form-footer {
      margin-top: 1.75rem;
      text-align: center;
      font-size: .85rem;
      color: rgba(255,255,255,.3);
    }

    .register-link {
      color: #a78bfa;
      text-decoration: none;
      font-weight: 500;
      margin-left: .25rem;
      transition: color .2s;
    }
    .register-link:hover { color: #c4b5fd; }

    /* ── Divider ── */
    .divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,.07); }
    .divider-text { font-size: .72rem; color: rgba(255,255,255,.2); letter-spacing: .08em; white-space: nowrap; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .login-root { grid-template-columns: 1fr; }
      .panel-left { display: none; }
    }

    .auth-theme-corner {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 100;
    }

    html:not(.dark) .login-root {
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
    html:not(.dark) .panel-right {
      background: transparent;
    }
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
    html:not(.dark) .remember-label { color: #64748b; }
    html:not(.dark) .forgot-link { color: #6d28d9; }
    html:not(.dark) .forgot-link:hover { color: #5b21b6; }
    html:not(.dark) .form-footer { color: #64748b; }
    html:not(.dark) .register-link { color: #6d28d9; }
    html:not(.dark) .register-link:hover { color: #5b21b6; }
    html:not(.dark) .suffix-btn { color: #64748b; }
    html:not(.dark) .suffix-btn:hover { color: #334155; }
    html:not(.dark) .divider-line { background: #e2e8f0; }
    html:not(.dark) .divider-text { color: #94a3b8; }
  `],
  template: `
    <div class="login-root">
      <div class="auth-theme-corner">
        <app-theme-toggle [inverted]="theme.isDark()" />
      </div>

      <!-- ── Left Decorative Panel ── -->
      <div class="panel-left">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>

        <div class="brand-mark">
          <div class="brand-icon">
            <mat-icon>auto_stories</mat-icon>
          </div>

          <h2 class="panel-headline">
            Your library,<br><em>reimagined</em>.
          </h2>
          <p class="panel-sub">
            A smarter way to manage books, members, and everything in between.
          </p>

          <div class="panel-stats">
            <div class="stat">
              <span class="stat-num">12k+</span>
              <span class="stat-label">Books</span>
            </div>
            <div class="stat">
              <span class="stat-num">3.4k</span>
              <span class="stat-label">Members</span>
            </div>
            <div class="stat">
              <span class="stat-num">99%</span>
              <span class="stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right Form Panel ── -->
      <div class="panel-right">
        <div class="form-shell">

          <div class="form-header">
            <h1 class="form-title">Welcome back</h1>
            <p class="form-sub">Sign in to your library account</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">

            <!-- Email -->
            <div class="field-wrap">
              <label class="field-label">Email address</label>
              <div class="field-inner">
                <mat-icon class="field-icon">alternate_email</mat-icon>
                <input
                  class="field-input"
                  type="email"
                  formControlName="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                />
              </div>
              <div class="field-error"
                   *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                <span *ngIf="loginForm.get('email')?.hasError('required')">Email is required</span>
                <span *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email</span>
              </div>
            </div>

            <!-- Password -->
            <div class="field-wrap">
              <label class="field-label">Password</label>
              <div class="field-inner">
                <mat-icon class="field-icon">lock_outline</mat-icon>
                <input
                  class="field-input"
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button class="suffix-btn" type="button" (click)="hidePassword = !hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              <div class="field-error"
                   *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                Password is required
              </div>
            </div>

            <!-- Remember / Forgot -->
            <div class="options-row">
              <label class="remember-label">
                <input type="checkbox" class="rounded border-slate-300">
                Remember me
              </label>
              <a class="forgot-link" href="#">Forgot password?</a>
            </div>

            <!-- Submit -->
            <button class="submit-btn" type="submit" [disabled]="loginForm.invalid || loading">
              <mat-icon *ngIf="loading" class="spin">refresh</mat-icon>
              <span *ngIf="!loading">Sign In</span>
              <mat-icon *ngIf="!loading" style="font-size:18px;width:18px;height:18px;">arrow_forward</mat-icon>
            </button>

          </form>

          <!-- Footer -->
          <p class="form-footer">
            Don't have an account?
            <a routerLink="/auth/register" class="register-link">Create one here</a>
          </p>

        </div>
      </div>

    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  readonly theme = inject(ThemeService);

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