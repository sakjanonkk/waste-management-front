import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeocodingRequest, GeocodingResponse } from '../../../shared/models/geocoding.model';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/geocoding';

  reverseGeocode(latitude: number, longitude: number): Observable<GeocodingResponse> {
    const request: GeocodingRequest = { latitude, longitude };
    return this.http.post<GeocodingResponse>(`${this.apiUrl}/reverse`, request);
  }
}
