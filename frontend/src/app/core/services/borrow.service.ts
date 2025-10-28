import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Borrow } from '../models/borrow.model';

export enum BorrowDuration {
  THREE_DAYS = '3_DAYS',
  FIVE_DAYS = '5_DAYS',
  ONE_WEEK = '1_WEEK',
  TWO_WEEKS = '2_WEEKS'
}

export interface BorrowRequest {
  bookId: string;
  duration: BorrowDuration;
  dueDate?: string;
}

export interface PayFineRequest {
  fineId: string;
  paymentMethod?: string;
  transactionReference?: string;
  notes?: string;
}

export interface FineConfiguration {
  id: string;
  dailyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class BorrowService {
  private apiUrl = `${environment.apiUrl}/borrows`;

  constructor(private http: HttpClient) {}

  getAll(userId?: string): Observable<Borrow[]> {
    let params = new HttpParams();
    if (userId) params = params.append('userId', userId);
    return this.http.get<Borrow[]>(this.apiUrl, { params });
  }

  getMyBorrows(): Observable<Borrow[]> {
    return this.http.get<Borrow[]>(`${this.apiUrl}/my-borrows`);
  }

  getById(id: string): Observable<Borrow> {
    return this.http.get<Borrow>(`${this.apiUrl}/${id}`);
  }

  create(data: { userId: string; bookId: string; duration: BorrowDuration; dueDate?: string }): Observable<Borrow> {
    return this.http.post<Borrow>(this.apiUrl, data);
  }

  // For students to borrow for themselves
  createSelf(data: BorrowRequest): Observable<Borrow> {
    return this.http.post<Borrow>(`${this.apiUrl}/self`, data);
  }

  returnBook(id: string, notes?: string): Observable<Borrow> {
    return this.http.patch<Borrow>(`${this.apiUrl}/${id}/return-self`, { notes });
  }

  renewBook(id: string, duration: BorrowDuration): Observable<Borrow> {
    return this.http.patch<Borrow>(`${this.apiUrl}/${id}/renew`, { duration });
  }

  payFine(data: PayFineRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/pay-fine`, data);
  }

  getMyFines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-fines`);
  }

  calculateFine(borrowId: string): Observable<{ amount: number; daysOverdue: number }> {
    return this.http.get<{ amount: number; daysOverdue: number }>(`${this.apiUrl}/${borrowId}/calculate-fine`);
  }

  getCurrentFineConfiguration(): Observable<FineConfiguration> {
    return this.http.get<FineConfiguration>(`${this.apiUrl}/fine-configuration/current`);
  }

  updateFineConfiguration(data: { dailyRate: number; isActive?: boolean }): Observable<FineConfiguration> {
    return this.http.post<FineConfiguration>(`${this.apiUrl}/fine-configuration`, data);
  }
}
