import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { MapSearchResult } from '../../../shared/models/map-search.model';
import { MapSearchOptions, MapSearchService } from './map-search.service';

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({
  providedIn: 'root'
})
export class OsmNominatimSearchService extends MapSearchService {
  private http = inject(HttpClient);

  search(query: string, options?: MapSearchOptions): Observable<MapSearchResult[]> {
    const q = query.trim();
    if (!q) {
      return of([]);
    }

    const limit = options?.limit ?? 8;
    const language = options?.language ?? 'th';

    return this.http
      .get<NominatimSearchResult[]>('https://nominatim.openstreetmap.org/search', {
        params: {
          q,
          format: 'json',
          addressdetails: '0',
          limit: String(limit),
          'accept-language': language
        }
      })
      .pipe(
        map((items) => {
          const mapped: Array<MapSearchResult | null> = (items ?? []).map((item) => {
            const latitude = Number(item.lat);
            const longitude = Number(item.lon);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            const result: MapSearchResult = {
              label: item.display_name,
              latitude,
              longitude,
              address: item.display_name,
              provider: 'nominatim',
              raw: item
            };

            return result;
          });

          return mapped.filter((x): x is MapSearchResult => x !== null);
        })
      );
  }
}
