import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID, Input, Output, EventEmitter, ViewChild, ElementRef, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { GeocodingService } from '../../../core/services/geocoding/geocoding.service';
import { LocationSelection } from '../../models/geocoding.model';
import { MapSearchResult } from '../../models/map-search.model';
import { MapSearchService } from '../../../core/services/map-search/map-search.service';
import { OsmNominatimSearchService } from '../../../core/services/map-search/osm-nominatim-search.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-picker-inline',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: MapSearchService, useExisting: OsmNominatimSearchService }
  ],
  template: `
    <div class="map-picker-inline">
      <div class="search-overlay">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>ค้นหาสถานที่</mat-label>
          <input
            matInput
            type="text"
            [formControl]="searchControl"
            [matAutocomplete]="auto" />
        </mat-form-field>

        <mat-autocomplete
          #auto="matAutocomplete"
          [displayWith]="displaySearchValue"
          (optionSelected)="onSearchOptionSelected($event.option.value)">
          @for (result of searchResults(); track result.label) {
            <mat-option [value]="result">{{ result.label }}</mat-option>
          }
        </mat-autocomplete>
      </div>

      @if (loading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="48"></mat-spinner>
          <p>กำลังโหลดข้อมูลตำแหน่ง...</p>
        </div>
      }

      <div #mapContainer class="map-container"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .map-picker-inline {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .search-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 60px;
      z-index: 1000;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .search-field {
      width: 100%;
      margin: 0;

      ::ng-deep .mat-mdc-form-field-flex {
        background: white;
      }
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 999;
      gap: 1rem;

      p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }

    .map-container {
      width: 100%;
      height: 100%;
    }
  `]
})
export class MapPickerInlineComponent implements OnInit, OnDestroy {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Output() locationSelected = new EventEmitter<LocationSelection>();
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private geocodingService = inject(GeocodingService);
  private searchService = inject(MapSearchService);

  loading = signal<boolean>(false);
  searchResults = signal<MapSearchResult[]>([]);
  selectedLocation = signal<LocationSelection | null>(null);
  
  searchControl = new FormControl('');
  private searchSubscription?: Subscription;

  private map?: L.Map;
  private marker?: L.Marker;
  private readonly defaultLat = 16.4419;
  private readonly defaultLng = 102.8360;

  constructor() {
    // Watch for input changes
    effect(() => {
      const lat = this.latitude;
      const lng = this.longitude;
      if (lat && lng && this.map) {
        this.updateMarkerPosition(lat, lng);
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initializeMap(), 100);
      this.setupSearch();
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    const lat = this.latitude || this.defaultLat;
    const lng = this.longitude || this.defaultLng;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [lat, lng],
      zoom: this.latitude ? 16 : 13,
      zoomControl: true
    });

    // Position zoom controls on the right side
    if (this.map.zoomControl) {
      this.map.zoomControl.setPosition('topright');
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    const customIcon = L.icon({
      iconUrl: 'assets/icons/marker-icon.png',
      iconRetinaUrl: 'assets/icons/marker-icon-2x.png',
      shadowUrl: 'assets/icons/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: true
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      if (this.marker) {
        const position = this.marker.getLatLng();
        this.onMarkerPositionChanged(position.lat, position.lng);
      }
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMarkerPositionChanged(e.latlng.lat, e.latlng.lng);
    });

    if (this.latitude && this.longitude) {
      this.fetchLocationInfo(this.latitude, this.longitude);
    }
  }

  private setupSearch() {
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => this.searchResults.set([])),
        switchMap((query) => {
          if (typeof query === 'string' && query.trim().length > 2) {
            return this.searchService.search(query).pipe(
              map((results) => results.slice(0, 5)),
              catchError(() => of([]))
            );
          }
          return of([]);
        })
      )
      .subscribe((results) => {
        this.searchResults.set(results);
      });
  }

  private onMarkerPositionChanged(lat: number, lng: number) {
    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
      this.map.panTo([lat, lng]);
    }
    this.fetchLocationInfo(lat, lng);
  }

  private updateMarkerPosition(lat: number, lng: number) {
    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 16);
    }
  }

  private fetchLocationInfo(lat: number, lng: number) {
    this.loading.set(true);
    
    this.geocodingService.reverseGeocode(lat, lng).subscribe({
      next: (response) => {
        const location: LocationSelection = {
          latitude: lat,
          longitude: lng,
          address: response.data?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          placeName: response.data?.place_name || 'ไม่พบข้อมูลสถานที่'
        };
        this.selectedLocation.set(location);
        this.locationSelected.emit(location);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Reverse geocoding error:', err);
        const location: LocationSelection = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          placeName: 'ไม่พบข้อมูลสถานที่'
        };
        this.selectedLocation.set(location);
        this.locationSelected.emit(location);
        this.loading.set(false);
      }
    });
  }

  displaySearchValue(result: MapSearchResult | string): string {
    return typeof result === 'string' ? result : result.label;
  }

  onSearchOptionSelected(result: MapSearchResult) {
    if (result && this.map && this.marker) {
      const lat = result.latitude;
      const lng = result.longitude;
      
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 16);
      
      this.fetchLocationInfo(lat, lng);
    }
    
    this.searchControl.setValue('', { emitEvent: false });
  }
}
