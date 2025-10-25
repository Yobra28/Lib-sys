import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Seat } from '../models/seat.model';

@Injectable({ providedIn: 'root' })
export class SeatService {
  private apiUrl = `${environment.apiUrl}/seats`;

  constructor(private http: HttpClient) {}

  getAll(floor?: number, section?: string): Observable<Seat[]> {
    let params = new HttpParams();
    if (floor !== undefined && floor !== null) params = params.append('floor', floor.toString());
    if (section) params = params.append('section', section);
    return this.http.get<Seat[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Seat> {
    return this.http.get<Seat>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Seat>): Observable<Seat> {
    return this.http.post<Seat>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Seat>): Observable<Seat> {
    return this.http.patch<Seat>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvailableSeats(date: string, startTime: string, endTime: string): Observable<Seat[]> {
    let params = new HttpParams()
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);
    return this.http.get<Seat[]>(`${this.apiUrl}/available`, { params });
  }

  getSections(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sections`);
  }

  searchAvailableSeatsByTimeRange(
    date: string,
    startTime: string,
    endTime: string,
    floor?: number,
    section?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);
    
    if (floor !== undefined && floor !== null) {
      params = params.append('floor', floor.toString());
    }
    if (section) {
      params = params.append('section', section);
    }
    
    return this.http.get<any>(`${this.apiUrl}/search-by-time`, { params });
  }

  getSeatAvailabilityDetails(seatId: string, date: string): Observable<any> {
    let params = new HttpParams().set('date', date);
    return this.http.get<any>(`${this.apiUrl}/${seatId}/availability`, { params });
  }
}
