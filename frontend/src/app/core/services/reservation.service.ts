import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  getAll(userId?: string, status?: string): Observable<Reservation[]> {
    let params = new HttpParams();
    if (userId) params = params.append('userId', userId);
    if (status) params = params.append('status', status);
    return this.http.get<Reservation[]>(this.apiUrl, { params });
  }

  getMyReservations(page: number = 1, limit: number = 5): Observable<{
    reservations: Reservation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{
      reservations: Reservation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`${this.apiUrl}/my-reservations`, { params });
  }

  getById(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  create(data: {
    seatId: string;
    reservationDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, data);
  }

  approve(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/approve`, {});
  }

  cancel(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/cancel`, {});
  }
}