import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  sentAt: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshUnreadCount();
  }

  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/my-notifications`);
  }

  // Admin/Librarian: fetch all notifications, optionally by user
  getAll(userId?: string): Observable<Notification[]> {
    let params = new HttpParams();
    if (userId) params = params.append('userId', userId);
    return this.http.get<Notification[]>(this.apiUrl, { params });
  }

  getUnreadCount(): Observable<number> {
    // Try server unread-count; if forbidden/not found, fallback to computing from my-notifications
    return this.http.get<number>(`${this.apiUrl}/unread-count`).pipe(
      tap(count => this.unreadCountSubject.next(count)),
      catchError(err => {
        if (err.status === 403 || err.status === 404) {
          return this.http.get<Notification[]>(`${this.apiUrl}/my-notifications`).pipe(
            map(list => list.filter(n => !n.isRead).length),
            tap(count => this.unreadCountSubject.next(count))
          );
        }
        this.unreadCountSubject.next(0);
        return of(0);
      })
    );
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({ error: () => this.unreadCountSubject.next(0) });
  }
}