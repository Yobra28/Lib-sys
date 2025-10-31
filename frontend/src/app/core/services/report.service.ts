import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeBorrows: number;
  totalSeats: number;
  pendingFinesAmount: number;
  totalFinesAmount: number;
  overdueBooks: number;
}

export interface BorrowingTrend {
  month: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface FinesTimeseriesPoint {
  month: string;
  paid: number;
  pending: number;
  total: number;
}

export interface BorrowStatusTimeseriesPoint {
  month: string;
  active: number;
  overdue: number;
  returned: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getMostBorrowedBooks(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/most-borrowed`, { params: { limit: String(limit) } });
  }

  getBorrowingTrends(months: number = 6): Observable<BorrowingTrend[]> {
    return this.http.get<BorrowingTrend[]>(`${this.apiUrl}/borrowing-trends`, { params: { months: String(months) } });
  }

  getCategoryDistribution(): Observable<CategoryDistribution[]> {
    return this.http.get<CategoryDistribution[]>(`${this.apiUrl}/category-distribution`);
  }

  getSeatUsageReport(): Observable<any> {
    return this.http.get(`${this.apiUrl}/seat-usage`);
  }

  getFineCollectionReport(startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate) params = params.append('startDate', startDate);
    if (endDate) params = params.append('endDate', endDate);
    return this.http.get(`${this.apiUrl}/fine-collection`, { params });
  }

  getUserActivityReport(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-activity/${userId}`);
  }

  getOverdueReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/overdue`);
  }

  getFinesTimeseries(months: number = 6): Observable<FinesTimeseriesPoint[]> {
    return this.http.get<FinesTimeseriesPoint[]>(`${this.apiUrl}/fines-timeseries`, { params: { months: String(months) } });
  }

  getBorrowStatusTimeseries(months: number = 6): Observable<BorrowStatusTimeseriesPoint[]> {
    return this.http.get<BorrowStatusTimeseriesPoint[]>(`${this.apiUrl}/borrows-status-timeseries`, { params: { months: String(months) } });
  }

  getSeatHeatmap(days: number = 7): Observable<{ days: string[]; hours: number[]; data: any }>{
    return this.http.get<{ days: string[]; hours: number[]; data: any }>(`${this.apiUrl}/seat-heatmap`, { params: { days: String(days) } });
  }

  getSystemLogs(limit: number = 50): Observable<Array<{ timestamp: string; type: string; message: string; ref: string }>> {
    return this.http.get<Array<{ timestamp: string; type: string; message: string; ref: string }>>(`${this.apiUrl}/system-logs`, { params: { limit: String(limit) } });
  }
}
