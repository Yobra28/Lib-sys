import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      type="button"
      (click)="theme.toggle()"
      [matTooltip]="theme.isDark() ? 'Light mode' : 'Dark mode'"
      [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      class="theme-toggle-btn"
      [class.theme-toggle-inverted]="inverted()">
      <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: [
    `
      .theme-toggle-btn {
        color: inherit;
      }
      .theme-toggle-inverted mat-icon {
        color: rgba(255, 255, 255, 0.88);
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  /** Use on dark headers (e.g. landing) so the icon stays visible */
  readonly inverted = input(false);
}
