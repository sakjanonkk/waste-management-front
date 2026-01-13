import { Component, inject, signal, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LocationSelection } from '../../models/geocoding.model';

declare const google: any;

@Component({
  selector: 'app-map-picker-inline',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="map-picker-inline">
      <!-- Search Box -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>ค้นหาสถานที่</mat-label>
        <input matInput #searchInput placeholder="พิมพ์ชื่อสถานที่...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <!-- Map -->
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
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      height: 100%;
    }

    .search-field {
      width: 100%;
    }

    .map-container {
      width: 100%;
      height: 300px; /* Default height */
      flex: 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
  `]
})
export class MapPickerInlineComponent implements OnInit {
  @Input({ transform: numberAttribute }) latitude: number | null = null;
  @Input({ transform: numberAttribute }) longitude: number | null = null;
  @Output() locationSelected = new EventEmitter<LocationSelection>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private map: any;
  private marker: any;
  
  // Default: Bangkok
  private readonly defaultLat = 13.7563;
  private readonly defaultLng = 100.5018;

  ngOnInit() {
    // Wait for view init roughly
    setTimeout(() => this.initMap(), 500);
  }

  private initMap() {
    if (typeof google === 'undefined') {
      console.warn('Google Maps API not loaded');
      setTimeout(() => this.initMap(), 1000); // Retry
      return;
    }

    const lat = this.latitude || this.defaultLat;
    const lng = this.longitude || this.defaultLng;
    const zoom = this.latitude ? 16 : 12;

    const mapOptions = {
      center: { lat, lng },
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] }
      ]
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    // Initial Marker
    this.placeMarker({ lat, lng }, false);

    // Click listener
    this.map.addListener('click', (event: any) => {
      this.handleMapClick(event.latLng);
    });

    // Search Box
    this.initAutocomplete();
  }

  private initAutocomplete() {
    if (!this.searchInput) return;

    const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, {
      componentRestrictions: { country: 'th' },
      fields: ['geometry', 'name', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      this.map.panTo(place.geometry.location);
      this.map.setZoom(16);
      this.handleMapClick(place.geometry.location);
    });
  }

  private handleMapClick(latLng: any) {
    this.placeMarker(latLng, true);
    this.reverseGeocode(latLng);
  }

  private placeMarker(latLng: any, emit: boolean) {
    // Convert generic object {lat, lng} to google LatLng if needed, 
    // but google maps handles {lat, lng} object fine usually.
    // Ensure we have lat() lng() methods if coming from event
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

    if (this.marker) {
      this.marker.setPosition({ lat, lng });
    } else {
      this.marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        draggable: true,
        animation: google.maps.Animation.DROP
      });

      this.marker.addListener('dragend', () => {
        const pos = this.marker.getPosition();
        this.handleMapClick(pos);
      });
    }

    if (emit) {
      // Address will be filled by reverse geocode async
      // For now emit coords
      this.locationSelected.emit({
        latitude: lat,
        longitude: lng,
        address: 'กำลังโหลดที่อยู่...',
        placeName: ''
      });
    }
  }

  private reverseGeocode(latLng: any) {
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        
        // Emit updated location with address
        this.locationSelected.emit({
          latitude: lat,
          longitude: lng,
          address: address,
          placeName: '' // Google doesn't easily give "Place Name" from reverse geocode unless strictly checking types
        });

        // Update search input text optionally? No, keeping custom search text is better usually.
      }
    });
  }
}
