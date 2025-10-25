import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { ReportService } from '../../../../core/services/report.service';

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

    this.reportService.getOverdueReport().subscribe({
      next: (overdue: any[]) => {
        this.overdueReport = overdue;
        this.loading = false;
      }
    });
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