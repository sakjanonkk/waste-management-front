import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, GenerateTodayResult, TodayRoutesDirectionsResult, TodayRoutesViewResult } from '../../../shared/models/daily-route.model';

@Injectable({
  providedIn: 'root'
})
export class DailyRouteService {
  private apiUrl = '/api/v1/daily-routes';

  constructor(private http: HttpClient) {}

  generateToday(): Observable<ApiResponse<GenerateTodayResult>> {
    return this.http.post<ApiResponse<GenerateTodayResult>>(`${this.apiUrl}/generate-today`, {});
  }

  getToday(): Observable<ApiResponse<TodayRoutesViewResult>> {
    return this.http.get<ApiResponse<TodayRoutesViewResult>>(`${this.apiUrl}/today`);
  }

  getTodayDirections(): Observable<ApiResponse<TodayRoutesDirectionsResult>> {
    return this.http.get<ApiResponse<TodayRoutesDirectionsResult>>(`${this.apiUrl}/today-directions`);
  }
}
