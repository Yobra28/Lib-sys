import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterUserDto {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdatePasswordDto {
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(filters?: FilterUserDto): Observable<{ users: User[]; total: number }> {
    let params = new HttpParams();
    if (filters?.search) params = params.append('search', filters.search);
    if (filters?.role) params = params.append('role', filters.role);
    if (filters?.isActive !== undefined) params = params.append('isActive', filters.isActive.toString());
    if (filters?.page) params = params.append('page', filters.page.toString());
    if (filters?.limit) params = params.append('limit', filters.limit.toString());
    
    return this.http.get<{ users: User[]; total: number }>(this.apiUrl, { params });
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, data);
  }

  update(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data);
  }

  activate(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  updatePassword(id: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/password`, { newPassword });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}

