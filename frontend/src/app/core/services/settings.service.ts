import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SystemSettings {
  [key: string]: any;
}

const DEFAULT_SETTINGS: SystemSettings = {
  libraryName: 'Smart Library',
  fineRatePerDay: 0,
  borrowLimit: 3,
  reservationLimit: 1
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;
  constructor(private http: HttpClient) {}

  get(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(this.apiUrl).pipe(
      catchError(err => {
        // If the API endpoint doesn't exist yet, gracefully fall back to defaults
        if (err.status === 404) return of({ ...DEFAULT_SETTINGS });
        return of({ ...DEFAULT_SETTINGS });
      })
    );
  }

  update(data: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.patch<SystemSettings>(this.apiUrl, data).pipe(
      catchError(() => of({ ...(data as SystemSettings) }))
    );
  }
}
