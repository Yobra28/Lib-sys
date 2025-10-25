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
}
