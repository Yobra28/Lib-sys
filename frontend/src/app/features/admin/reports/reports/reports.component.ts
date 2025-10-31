import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { ReportService, FinesTimeseriesPoint, BorrowStatusTimeseriesPoint } from '../../../../core/services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  dashboardStats: any = null;
  mostBorrowedBooks: any[] = [];
  borrowingTrends: any[] = [];
  categoryDistribution: any[] = [];
  overdueReport: any[] = [];
  finesSeries: FinesTimeseriesPoint[] = [];
  borrowStatusSeries: BorrowStatusTimeseriesPoint[] = [];
  seatHeatmap: { days: string[]; hours: number[]; data: any } | null = null;
  systemLogs: Array<{ timestamp: string; type: string; message: string; ref: string }> = [];
  loading = false;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadAllReports();
  }

  loadAllReports() {
    this.loading = true;

    this.reportService.getDashboardStats().subscribe({
      next: (stats: any) => {
        this.dashboardStats = stats;
      }
    });

    this.reportService.getMostBorrowedBooks(10).subscribe({
      next: (books: any[]) => {
        this.mostBorrowedBooks = books;
      }
    });

    this.reportService.getBorrowingTrends(6).subscribe({
      next: (trends: any[]) => {
        this.borrowingTrends = trends;
      }
    });

    this.reportService.getCategoryDistribution().subscribe({
      next: (categories: any[]) => {
        this.categoryDistribution = categories;
      }
    });

    this.reportService.getFinesTimeseries(6).subscribe({
      next: (series) => this.finesSeries = series
    });

    this.reportService.getBorrowStatusTimeseries(6).subscribe({
      next: (series) => this.borrowStatusSeries = series
    });

    this.reportService.getSeatHeatmap(7).subscribe({
      next: (hm) => this.seatHeatmap = hm
    });

    this.reportService.getSystemLogs(50).subscribe({
      next: (logs) => this.systemLogs = logs
    });

    this.reportService.getOverdueReport().subscribe({
      next: (overdue: any[]) => {
        this.overdueReport = overdue;
        this.loading = false;
      }
    });
  }

  getFinesMax(): number {
    if (!this.finesSeries || this.finesSeries.length === 0) return 0;
    return this.finesSeries.reduce((m, p) => Math.max(m, p.paid, p.pending, p.total), 0);
  }

  getFinesPolyline(series: 'paid' | 'pending'): string {
    if (!this.finesSeries || this.finesSeries.length === 0) return '';
    const len = this.finesSeries.length;
    const max = this.getFinesMax() || 1;
    const points: string[] = [];
    for (let i = 0; i < len; i++) {
      const x = 40 + i * (540 / Math.max(1, len - 1));
      const value = series === 'paid' ? this.finesSeries[i].paid : this.finesSeries[i].pending;
      const y = 200 - (value / max) * 180;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  finesLabelX(index: number): number {
    if (!this.finesSeries || this.finesSeries.length === 0) return 40;
    const len = this.finesSeries.length;
    return 40 + index * (540 / Math.max(1, len - 1));
  }

  heatColor(value: number): string {
    // Simple green scale 0..max, compute relative to a rough cap
    const max = 10; // tune as needed
    const v = Math.max(0, Math.min(1, value / max));
    const g = Math.floor(255 * v);
    return `rgba(16,185,129,${0.15 + 0.75 * v})`;
  }

  exportToPDF() {
    const content = document.createElement('div');
    content.innerHTML = `\n      <h2>Smart Library Reports</h2>\n      <p>Most Borrowed Books</p>\n      <pre>${JSON.stringify(this.mostBorrowedBooks, null, 2)}</pre>\n      <p>Overdue Report</p>\n      <pre>${JSON.stringify(this.overdueReport, null, 2)}</pre>\n    `;
    const w = window.open('', 'printWin');
    if (!w) return;
    w.document.write(content.outerHTML);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  exportToCSV() {
    const rows = [['Title','Author','Count']].concat(
      (this.mostBorrowedBooks || []).map((r: any) => [r.title || r.book?.title, r.author || r.book?.author, r.count || r.timesBorrowed])
    );
    const csv = rows.map(r => r.map(x => '"' + (x ?? '') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'most_borrowed_books.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}