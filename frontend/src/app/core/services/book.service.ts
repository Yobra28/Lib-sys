import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/book.model';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AiRecommendedBook extends Book {
  aiReason?: string;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { search?: string; category?: string; status?: string; page?: number; limit?: number }): Observable<Paginated<Book>> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    return this.http.get<Paginated<Book>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Book>): Observable<Book> {
    return this.http.patch<Book>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getRecommendations(params: { category: string; limit?: number; studentId?: string }): Observable<Book[]> {
    let httpParams = new HttpParams().set('category', params.category);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.studentId) httpParams = httpParams.set('studentId', params.studentId);
    return this.http.get<Book[]>(`${this.apiUrl}/recommendations`, { params: httpParams });
  }

  /**
   * AI agent-based recommendations for the currently logged-in user.
   * The backend infers the user from the JWT; no filters are needed here.
   */
  getAiAgentRecommendationsForMe(limit?: number): Observable<AiRecommendedBook[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit);
    return this.http.get<AiRecommendedBook[]>(`${this.apiUrl}/ai-agent/me`, { params });
  }
}
