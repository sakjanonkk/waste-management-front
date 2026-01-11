import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { GeocodingService } from '../../../core/services/geocoding/geocoding.service';
import { LocationSelection, GeocodingResponse } from '../../models/geocoding.model';
import { MapSearchResult } from '../../models/map-search.model';
import { MapSearchService } from '../../../core/services/map-search/map-search.service';
import { OsmNominatimSearchService } from '../../../core/services/map-search/osm-nominatim-search.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [
    MatDialogModule,
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
    <div class="map-picker-dialog">
      <div class="map-picker-header">
        <h2>เลือกตำแหน่งบนแผนที่</h2>
        <button mat-icon-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="map-picker-content">
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

        @if (selectedLocation()) {
          <div class="location-info">
            <div class="info-item">
              <mat-icon>place</mat-icon>
              <span>{{ selectedLocation()?.placeName || 'ไม่พบชื่อสถานที่' }}</span>
            </div>
            <div class="info-item">
              <mat-icon>location_on</mat-icon>
              <span>{{ selectedLocation()?.address || 'ไม่พบที่อยู่' }}</span>
            </div>
            <div class="info-item coordinates">
              <mat-icon>my_location</mat-icon>
              <span>{{ selectedLocation()!.latitude.toFixed(6) }}, {{ selectedLocation()!.longitude.toFixed(6) }}</span>
            </div>
          </div>
        }
      </div>

      <div class="map-picker-actions">
        <button mat-stroked-button (click)="onCancel()">
          ยกเลิก
        </button>
        <button 
          mat-flat-button 
          color="primary" 
          (click)="onConfirm()"
          [disabled]="!selectedLocation() || loading()">
          ยืนยัน
        </button>
      </div>
    </div>
  `,
  styles: [`
    .map-picker-dialog {
      display: flex;
      flex-direction: column;
      height: 80vh;
      max-height: 700px;
      width: 90vw;
      max-width: 900px;
    }

    .map-picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }
    }

    .map-picker-content {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    .search-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      /* Leaflet panes/controls can use very high z-index values; ensure search stays on top */
      z-index: 1100;
      pointer-events: none;

      .search-field {
        width: 100%;
        pointer-events: auto;
        background: white;
        border-radius: 8px;
      }
    }

    .map-container {
      width: 100%;
      height: 100%;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 16px;
      z-index: 10;

      p {
        margin: 0;
        color: #666;
      }
    }

    .location-info {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 5;

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        mat-icon {
          color: #1976d2;
          font-size: 20px;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        span {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
        }

        &.coordinates span {
          font-family: monospace;
          color: #666;
        }
      }
    }

    .map-picker-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class MapPickerComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<MapPickerComponent>);
  private geocodingService = inject(GeocodingService);
  private mapSearchService = inject(MapSearchService);
  private platformId = inject(PLATFORM_ID);

  loading = signal(false);
  selectedLocation = signal<LocationSelection | null>(null);

  searchControl = new FormControl<string | MapSearchResult>('', { nonNullable: true });
  searchResults = signal<MapSearchResult[]>([]);
  searchLoading = signal(false);

  private searchSub?: Subscription;

  private map!: L.Map;
  private marker?: L.Marker;
  private defaultCenter: L.LatLngExpression = [16.432434, 102.827454]; // ขอนแก่น

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }

	this.setupSearch();
  }

  ngOnDestroy() {
	this.searchSub?.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  displaySearchValue = (value: string | MapSearchResult): string => {
    if (typeof value === 'string') return value;
    return value?.label ?? '';
  };

  private setupSearch() {
    this.searchSub = this.searchControl.valueChanges
      .pipe(
        map((value) => (typeof value === 'string' ? value : value?.label ?? '')),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const q = query.trim();
          if (q.length < 2) {
            this.searchLoading.set(false);
            return of([] as MapSearchResult[]);
          }

          this.searchLoading.set(true);
          return this.mapSearchService.search(q, { limit: 8, language: 'th' }).pipe(
            catchError(() => of([] as MapSearchResult[])),
            tap(() => this.searchLoading.set(false))
          );
        })
      )
      .subscribe((results) => {
        this.searchResults.set(results);
      });
  }

  onSearchOptionSelected(result: MapSearchResult) {
    if (!result || !this.map) return;
    const { latitude, longitude } = result;
    this.map.setView([latitude, longitude], 16);
    this.onMapClick(latitude, longitude);
  }

  private initMap() {
    const mapContainer = document.querySelector('.map-container') as HTMLElement;
    
    if (!mapContainer) return;

    // Initialize Leaflet map
    this.map = L.map(mapContainer).setView(this.defaultCenter, 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add click listener
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      this.onMapClick(lat, lng);
    });
  }

  private onMapClick(lat: number, lng: number) {
    // Update marker
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      // Create custom icon to fix default marker issue
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      this.marker = L.marker([lat, lng], {
        draggable: true,
        icon: customIcon
      }).addTo(this.map);

      // Add drag listener
      this.marker.on('dragend', (event: L.DragEndEvent) => {
        const { lat: newLat, lng: newLng } = event.target.getLatLng();
        this.fetchLocationDetails(newLat, newLng);
      });
    }

    this.fetchLocationDetails(lat, lng);
  }

  private fetchLocationDetails(lat: number, lng: number) {
    this.loading.set(true);

    this.geocodingService.reverseGeocode(lat, lng).subscribe({
      next: (response: GeocodingResponse) => {
        if (response.success && response.data) {
          const data = response.data;
          this.selectedLocation.set({
            latitude: lat,
            longitude: lng,
            address: data.address || '',
            placeName: data.place_name || ''
          });
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error fetching location details:', err);
        // Still allow selection even if geocoding fails
        this.selectedLocation.set({
          latitude: lat,
          longitude: lng,
          address: 'ไม่สามารถดึงข้อมูลที่อยู่ได้',
          placeName: ''
        });
        this.loading.set(false);
      }
    });
  }

  onConfirm() {
    if (this.selectedLocation()) {
      this.dialogRef.close(this.selectedLocation());
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
