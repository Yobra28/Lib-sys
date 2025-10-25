import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Fine } from '../models/fine.model';

@Injectable({
  providedIn: 'root'
})
export class FineService {
  private apiUrl = `${environment.apiUrl}/fines`;

  constructor(private http: HttpClient) {}

  getAll(userId?: string, status?: string): Observable<Fine[]> {
    let params = new HttpParams();
    if (userId) params = params.append('userId', userId);
    if (status) params = params.append('status', status);
    return this.http.get<Fine[]>(this.apiUrl, { params });
  }

  getMyFines(): Observable<Fine[]> {
    return this.http.get<Fine[]>(`${this.apiUrl}/my-fines`);
  }

  getById(id: string): Observable<Fine> {
    return this.http.get<Fine>(`${this.apiUrl}/${id}`);
  }

  getTotalFines(userId?: string): Observable<{ totalAmount: number; count: number }> {
    let params = new HttpParams();
    if (userId) params = params.append('userId', userId);
    return this.http.get<{ totalAmount: number; count: number }>(`${this.apiUrl}/total`, { params });
  }

  markAsPaid(id: string): Observable<Fine> {
    return this.http.patch<Fine>(`${this.apiUrl}/${id}/pay`, {});
  }

  waive(id: string, notes?: string): Observable<Fine> {
    return this.http.patch<Fine>(`${this.apiUrl}/${id}/waive`, { notes });
  }
}
