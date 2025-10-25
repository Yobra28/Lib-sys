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

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/my-reservations`);
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