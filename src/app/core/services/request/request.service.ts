import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private apiUrl = '/api/v1/requests';
  constructor(private http: HttpClient) {}

  createRequest(data: FormData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getRequests(params: any): Observable<any> {
    return this.http.get(this.apiUrl, { params });
  }

  approveRequest(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectRequest(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/reject`, {});
  }
}
