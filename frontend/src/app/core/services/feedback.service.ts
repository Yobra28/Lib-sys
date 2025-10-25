import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Feedback {
  id: string;
  userId: string;
  subject: string;
  message: string;
  response?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  getAll(isRead?: boolean): Observable<Feedback[]> {
    let params = new HttpParams();
    if (isRead !== undefined) {
      params = params.append('isRead', isRead.toString());
    }
    return this.http.get<Feedback[]>(this.apiUrl, { params });
  }

  getMyFeedback(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/my-feedback`);
  }

  getById(id: string): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/${id}`);
  }

  create(data: { subject: string; message: string }): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, data);
  }

  respond(id: string, response: string): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.apiUrl}/${id}/respond`, { response });
  }

  markAsRead(id: string): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.apiUrl}/${id}/read`, {});
  }
}