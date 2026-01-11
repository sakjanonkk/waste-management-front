import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

import { DailyRouteService } from '../../core/services/daily-route/daily-route.service';
import { GenerateTodayResult, RoutePlan, StopView, TodayRoutesViewResult } from '../../shared/models/daily-route.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-daily-route',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DecimalPipe,
  ],
  templateUrl: './daily-route.page.component.html',
  styleUrls: ['./daily-route.page.component.scss']
})
export class DailyRoutePageComponent {
  private dailyRouteService = inject(DailyRouteService);
  private snack = inject(MatSnackBar);

  isGenerating = false;
  generateResult: GenerateTodayResult | null = null;

  isLoadingTodayView = false;
  todayView: TodayRoutesViewResult | null = null;

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  private map?: google.maps.Map;
  private directionsService?: google.maps.DirectionsService;
  private renderers: google.maps.DirectionsRenderer[] = [];
  private markers: google.maps.Marker[] = [];
  private viewReady = false;
  private isMapInitializing = false;
  private mapsApiConfigured = false;

  // Colors for different routes (each vehicle gets a different color)
  private readonly routeColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
  ];

  // Placeholder data for UI mockup
  mockRoutes: Array<{
    id: string;
    driver: string;
    fullCapacity: string;
    currentCapacity: string;
    distance: string;
    cost: string;
    status: string;
  }> = [];

  currentPage = 1;
  itemsPerPage = 3;
  totalItems = 3;

  get totalVehicles(): number {
    return this.todayView?.routes?.length ?? 0;
  }

  get totalDistanceKm(): number {
    if (!this.todayView?.routes?.length) return 0;
    return this.todayView.routes.reduce((sum, r) => sum + (r.estimated_distance_km ?? 0), 0);
  }

  get totalCost(): number {
    if (!this.todayView?.routes?.length) return 0;
    return this.todayView.routes.reduce((sum, r) => sum + (r.fuel_cost_estimate_thb ?? 0), 0);
  }

  get totalFuelCost(): number {
    if (!this.todayView?.routes?.length) return 0;
    return this.todayView.routes.reduce((sum, r) => sum + (r.fuel_cost_estimate_thb ?? 0), 0);
  }

  get routesForTable() {
    // Use todayView instead of generateResult for actual route data
    if (!this.todayView?.routes?.length) {
      return this.mockRoutes;
    }
    return this.todayView.routes.map((r) => ({
      id: `รถคันที่ ${r.vehicle_id}`,
      driver: `พนักงานคนที่ ${r.driver_id}`,
      fullCapacity: r.regular_capacity ? `${r.regular_capacity} กก.` : '-',
      currentCapacity: r.recycle_capacity ? `${r.recycle_capacity} กก.` : '-',
      distance: `${(r.estimated_distance_km ?? 0).toFixed(2)} กิโลเมตร`,
      cost: r.fuel_cost_estimate_thb ? `${r.fuel_cost_estimate_thb.toFixed(2)} บาท` : '-',
      status: `${(r.stops?.length ?? 0) - 2} จุด` // Exclude start and end hub
    }));
  }

  ngOnInit() {
    // Load today's plan if it exists, so the map can show immediately.
    this.fetchTodayView();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    // If data already loaded before view init, render now.
    if (this.todayView?.routes?.length) {
      this.renderTodayOnMap();
    }
  }

  ngOnDestroy() {
    this.clearMapOverlays();
    this.map = undefined;
    this.directionsService = undefined;
  }

  onGenerateToday() {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.dailyRouteService.generateToday().subscribe({
      next: (res) => {
        this.generateResult = res.data ?? null;
        const count = this.generateResult?.routes?.length ?? 0;
        this.totalItems = count;
        this.snack.open(`คำนวณเส้นทางสำเร็จ (${count} เส้นทาง)`, 'ปิด', { duration: 2500 });
        this.isGenerating = false;

        // After VRP solve + save, fetch the stored plan and render it on the map.
        this.fetchTodayView();
      },
      error: (err: unknown) => {
        let msg = 'คำนวณเส้นทางไม่สำเร็จ';
        if (err instanceof HttpErrorResponse) {
          msg = err.error?.message || err.message || msg;
          if (err.status === 409) {
            msg = msg || 'มีเส้นทางของวันนี้แล้ว';
          }
        }
        this.snack.open(msg, 'ปิด', { duration: 3500 });
        this.isGenerating = false;

        // Even if routes already exist (409), we still want to show today's map.
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.fetchTodayView();
        }
      }
    });
  }

  private fetchTodayView() {
    if (this.isLoadingTodayView) return;

    this.isLoadingTodayView = true;
    this.dailyRouteService.getToday().subscribe({
      next: (res) => {
        this.todayView = res.data ?? null;
        this.isLoadingTodayView = false;
        if (this.todayView?.routes?.length) {
          this.renderTodayOnMap();
        }
      },
      error: (err: unknown) => {
        // Don't block the page if map data can't be loaded.
        console.error('Failed to load today routes view:', err);
        this.isLoadingTodayView = false;
      }
    });
  }

  private async ensureGoogleMapInitialized(): Promise<void> {
    if (this.map || !this.viewReady || this.isMapInitializing) return;
    const el = this.mapContainer?.nativeElement;
    if (!el) return;

    const apiKey = environment.GOOGLE_MAPS_API_KEY ?? '';
    if (!apiKey) {
      this.snack.open('ยังไม่ได้ตั้งค่า Google Maps API Key', 'ปิด', { duration: 3500 });
      return;
    }

    this.isMapInitializing = true;
    try {
      if (!this.mapsApiConfigured) {
        setOptions({
          key: apiKey,
          v: 'weekly',
        });
        this.mapsApiConfigured = true;
      }

      const { Map } = await importLibrary('maps');
      await importLibrary('routes');

      this.map = new Map(el, {
        center: { lat: 16.432434, lng: 102.827454 }, // ขอนแก่น
        zoom: 13,
        mapTypeControl: false,
      });
      this.directionsService = new google.maps.DirectionsService();

      // Ensure layout settles before first render.
      setTimeout(() => google.maps.event.trigger(this.map!, 'resize'), 0);
    } finally {
      this.isMapInitializing = false;
    }
  }

  private clearMapOverlays() {
    for (const r of this.renderers) {
      r.setMap(null);
    }
    this.renderers = [];

    for (const m of this.markers) {
      m.setMap(null);
    }
    this.markers = [];
  }

  private async renderTodayOnMap() {
    await this.ensureGoogleMapInitialized();
    if (!this.map || !this.directionsService || !this.todayView?.routes?.length) return;

    this.clearMapOverlays();

    const bounds = new google.maps.LatLngBounds();

    // Place markers first (fast feedback).
    for (const route of this.todayView.routes) {
      for (const s of route.stops ?? []) {
        if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') continue;
        const pos = { lat: s.latitude, lng: s.longitude };
        bounds.extend(pos);
        const marker = new google.maps.Marker({
          position: pos,
          map: this.map,
          title: s.point_name ? String(s.point_name) : undefined,
        });
        this.markers.push(marker);
      }
    }

    // Render directions per route (in VRP stop order; no optimization).
    for (let i = 0; i < this.todayView.routes.length; i++) {
      const route = this.todayView.routes[i];
      const stops = (route.stops ?? []).filter(
        (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number'
      );
      if (stops.length < 2) continue;
      const color = this.routeColors[i % this.routeColors.length];
      await this.renderDirectionsForStops(stops, color);
    }

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, 50);
    }
  }

  private async renderDirectionsForStops(stops: StopView[], color: string): Promise<void> {
    if (!this.map || !this.directionsService) return;

    // Google waypoint limits: typically 23 waypoints + origin + destination.
    const maxWaypoints = 23;
    const maxTotalPoints = maxWaypoints + 2;

    for (let start = 0; start < stops.length - 1; ) {
      let end = start + maxTotalPoints - 1;
      if (end >= stops.length) end = stops.length - 1;

      const segment = stops.slice(start, end + 1);
      await this.renderDirectionsSegment(segment, color);

      if (end === stops.length - 1) break;
      // Overlap last point as next segment origin.
      start = end;
    }
  }

  private renderDirectionsSegment(segment: StopView[], color: string): Promise<void> {
    if (!this.map || !this.directionsService) return Promise.resolve();
    if (segment.length < 2) return Promise.resolve();

    const origin = { lat: segment[0].latitude, lng: segment[0].longitude };
    const destination = { lat: segment[segment.length - 1].latitude, lng: segment[segment.length - 1].longitude };

    const waypoints: google.maps.DirectionsWaypoint[] = [];
    for (let i = 1; i < segment.length - 1; i++) {
      waypoints.push({
        location: { lat: segment[i].latitude, lng: segment[i].longitude },
        stopover: true,
      });
    }

    return new Promise((resolve) => {
      this.directionsService!.route(
        {
          origin,
          destination,
          waypoints,
          optimizeWaypoints: false,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (
          result: google.maps.DirectionsResult | null,
          status: google.maps.DirectionsStatus
        ) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const renderer = new google.maps.DirectionsRenderer({
              map: this.map!,
              directions: result,
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: color,
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            });
            this.renderers.push(renderer);
          } else {
            console.warn('Directions request failed:', status);
          }
          resolve();
        }
      );
    });
  }
}
