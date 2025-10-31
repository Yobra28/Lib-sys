import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReportService } from '../../../../core/services/report.service';

type LogEntry = { timestamp: string; type: string; message: string; ref: string };

@Component({
  selector: 'app-logs-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './logs-list.component.html',
  styleUrls: ['./logs-list.component.css']
})
export class LogsListComponent implements OnInit {
  displayedColumns: string[] = ['timestamp', 'type', 'message', 'ref'];
  dataSource = new MatTableDataSource<LogEntry>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  fetchLogs(): void {
    this.loading = true;
    // Fetch a larger set and paginate client-side
    this.reportService.getSystemLogs(500).subscribe({
      next: (logs) => {
        this.dataSource.data = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilter(value: string) {
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        data.type.toLowerCase().includes(f) ||
        data.message.toLowerCase().includes(f) ||
        data.ref.toLowerCase().includes(f)
      );
    };
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}


