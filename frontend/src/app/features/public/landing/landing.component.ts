import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css', './landing.component.light.css']
})
export class LandingComponent {
  public year = new Date().getFullYear();
  readonly theme = inject(ThemeService);
}
