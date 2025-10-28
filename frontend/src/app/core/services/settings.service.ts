import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SystemSettings {
  libraryName?: string;
  fineRatePerDay?: number;
  borrowLimit?: number;
  reservationLimit?: number;
  maxBorrowingDays?: number;
  maxRenewals?: number;
  renewalDays?: number;
  notificationEmailEnabled?: boolean;
  autoApproveReservations?: boolean;
  maintenanceMode?: boolean;
  [key: string]: any;
}

const DEFAULT_SETTINGS: SystemSettings = {
  libraryName: 'Smart Library',
  fineRatePerDay: 50,
  borrowLimit: 3,
  reservationLimit: 1,
  maxBorrowingDays: 14,
  maxRenewals: 3,
  renewalDays: 7,
  notificationEmailEnabled: true,
  autoApproveReservations: false,
  maintenanceMode: false
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;
  constructor(private http: HttpClient) {}

  get(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(this.apiUrl);
  }

  update(data: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(this.apiUrl, data);
  }
}
