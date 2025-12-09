import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollectionPoint, CollectionPointListResponse, CollectionPointResponse } from '../../../shared/models/collection-point.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionPointService {
  private apiUrl = '/api/v1/collection-points';

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, perPage: number = 100): Observable<CollectionPointListResponse> {
    return this.http.get<CollectionPointListResponse>(this.apiUrl, {
      params: {
        page: page.toString(),
        per_page: perPage.toString()
      }
    });
  }

  getById(id: number): Observable<CollectionPointResponse> {
    return this.http.get<CollectionPointResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<CollectionPoint>): Observable<CollectionPointResponse> {
    return this.http.post<CollectionPointResponse>(this.apiUrl, data);
  }

  update(id: number, data: Partial<CollectionPoint>): Observable<CollectionPointResponse> {
    return this.http.put<CollectionPointResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<CollectionPointResponse> {
  return this.http.delete<CollectionPointResponse>(`${this.apiUrl}/${id}`);
}
}
