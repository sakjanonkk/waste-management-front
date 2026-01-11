import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MapSearchResult } from '../../../shared/models/map-search.model';

export interface MapSearchOptions {
  limit?: number;
  language?: string;
}

@Injectable()
export abstract class MapSearchService {
  abstract search(query: string, options?: MapSearchOptions): Observable<MapSearchResult[]>;
}
