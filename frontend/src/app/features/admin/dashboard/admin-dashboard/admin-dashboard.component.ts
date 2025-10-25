import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReportService, DashboardStats, CategoryDistribution } from '../../../../core/services/report.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  stats: DashboardStats | null = null;
  trends: { month: string; count: number }[] = [];
  topBooks: any[] = [];
  categories: CategoryDistribution[] = [];
  donutStyle = '';
  currentUser: User | null = null;

  constructor(private reports: ReportService, private auth: AuthService) {}

  ngOnInit() {
    this.auth.currentUser.subscribe(u => this.currentUser = u);
    this.load();
  }

  load() {
    this.loading = true;
    this.reports.getDashboardStats().subscribe({
      next: (s) => { this.stats = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.reports.getBorrowingTrends(6).subscribe(t => this.trends = t);
    this.reports.getMostBorrowedBooks(5).subscribe(b => this.topBooks = b);
    this.reports.getCategoryDistribution().subscribe(d => {
      this.categories = d || [];
      this.donutStyle = this.computeDonutGradient(this.categories);
    });
  }

  private computeDonutGradient(data: CategoryDistribution[]): string {
    const total = data.reduce((s, x) => s + (x.count || 0), 0) || 1;
    const palette = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'];
    let acc = 0;
    const parts: string[] = [];
    data.forEach((d, i) => {
      const start = (acc / total) * 100;
      acc += d.count || 0;
      const end = (acc / total) * 100;
      parts.push(`${palette[i % palette.length]} ${start}% ${end}%`);
    });
    if (!parts.length) parts.push(`#e2e8f0 0 100%`);
    return `background: conic-gradient(${parts.join(', ')});`;
  }
}
