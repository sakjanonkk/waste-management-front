import { Component, OnInit, AfterViewInit, signal, inject, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../../core/services/request/request.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

declare const google: any;

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    NgxSkeletonLoaderModule,
    DatePipe,
    DecimalPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
})
export class RequestListComponent implements OnInit, AfterViewInit {
  private requestService = inject(RequestService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Signals for state
  data = signal<any[]>([]);
  total = signal<number>(0);
  loading = signal<boolean>(true);
  
  // Selected request for map
  selectedRequest = signal<any | null>(null);
  selectedAddress = signal<string>('');

  // Filters
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);
  statusFilter = signal<string>('');
  typeFilter = signal<string>('');

  // Google Map
  private map: any = null;
  private markers: any[] = [];
  private mapReady = false;
  private pendingMarkerUpdate = false;

  ngOnInit() {
    this.fetchRequests();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  private initMap() {
    const mapElement = document.getElementById('request-map');
    if (!mapElement || typeof google === 'undefined') {
      console.warn('Google Maps not available, retrying...');
      setTimeout(() => this.initMap(), 500);
      return;
    }

    this.map = new google.maps.Map(mapElement, {
      center: { lat: 13.7563, lng: 100.5018 }, // Bangkok
      zoom: 10,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] }
      ]
    });
    
    this.mapReady = true;
    
    // If data was loaded before map was ready, update markers now
    if (this.pendingMarkerUpdate) {
      this.pendingMarkerUpdate = false;
      this.updateMapMarkers();
    }
  }

  private updateMapMarkers() {
    // Clear existing markers
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    if (!this.map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    this.data().forEach(request => {
      if (request.latitude && request.longitude) {
        hasValidCoords = true;
        const position = { lat: request.latitude, lng: request.longitude };
        
        const marker = new google.maps.Marker({
          position,
          map: this.map,
          title: request.point_name || `#${request.id}`,
          icon: this.getMarkerIcon(request.status),
        });

        marker.addListener('click', () => {
          this.selectRequest(request);
        });

        this.markers.push(marker);
        bounds.extend(position);
      }
    });

    if (hasValidCoords && this.markers.length > 0) {
      this.map.fitBounds(bounds);
      if (this.markers.length === 1) {
        this.map.setZoom(15);
      }
    }
  }

  private getMarkerIcon(status: string): any {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444'
    };
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: colors[status] || '#6b7280',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  }

  selectRequest(request: any) {
    this.selectedRequest.set(request);
    this.selectedAddress.set('');

    if (this.map && request.latitude && request.longitude) {
      this.map.panTo({ lat: request.latitude, lng: request.longitude });
      this.map.setZoom(16);
      
      // Fetch address using reverse geocoding
      this.fetchAddress(request.latitude, request.longitude);
    }
  }

  private async fetchAddress(lat: number, lng: number) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        this.selectedAddress.set(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }

  fetchRequests() {
    this.loading.set(true);
    const params: any = {
      page: this.pageIndex() + 1,
      per_page: this.pageSize(),
    };

    if (this.statusFilter()) params.status = this.statusFilter();
    if (this.typeFilter()) params.request_type = this.typeFilter();

    this.requestService.getRequests(params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.data.set(res.data.requests);
          this.total.set(res.data.pagination.total_rows);
          
          // Update map after data loaded
          if (this.mapReady) {
            setTimeout(() => this.updateMapMarkers(), 100);
          } else {
            this.pendingMarkerUpdate = true;
          }
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching requests:', err);
        this.loading.set(false);
        this.snackBar.open('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  // Stats counts
  getPendingCount(): number {
    return this.data().filter(r => r.status === 'pending').length;
  }

  getApprovedCount(): number {
    return this.data().filter(r => r.status === 'approved').length;
  }

  getRejectedCount(): number {
    return this.data().filter(r => r.status === 'rejected').length;
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchRequests();
  }

  onFilterChange() {
    this.pageIndex.set(0);
    this.fetchRequests();
  }

  openManageDialog(request: any) {
    import('../request-detail-dialog/request-detail-dialog.component').then(
      (m) => {
        const dialogRef = this.dialog.open(m.RequestDetailDialogComponent, {
          data: request,
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          autoFocus: false,
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result === 'approve') {
            this.handleApprove(request);
          } else if (result === 'reject') {
            this.handleReject(request.id);
          }
        });
      }
    );
  }

  handleApprove(request: any) {
    this.requestService.approveRequest(request.id).subscribe({
      next: (res: any) => {
        this.snackBar.open('อนุมัติคำร้องเรียบร้อยแล้ว', 'ปิด', {
          duration: 3000,
        });
        
        const type = (request.request_type || '').trim();
        console.log('Approved request type:', type);

        if (type === 'request_point') {
          console.log('Redirecting to new collection point...');
          this.router.navigate(['/collection-point/new'], {
            queryParams: {
              requestId: request.id,
              lat: request.latitude ?? request.lat,
              lng: request.longitude ?? request.lng,
              address: request.address || this.selectedAddress() || '',
              locationName: request.point_name || request.location_name || ''
            }
          });
        } else {
          this.fetchRequests();
        }
      },
      error: (err: any) => {
        console.error('Error approving request:', err);
        this.snackBar.open('เกิดข้อผิดพลาดในการอนุมัติ', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  handleReject(id: number) {
    this.requestService.rejectRequest(id).subscribe({
      next: (res: any) => {
        this.snackBar.open('ปฏิเสธคำร้องเรียบร้อยแล้ว', 'ปิด', {
          duration: 3000,
        });
        this.fetchRequests();
      },
      error: (err: any) => {
        console.error('Error rejecting request:', err);
        this.snackBar.open('เกิดข้อผิดพลาดในการปฏิเสธ', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  // Helpers
  getRequestTypeName(type: string): string {
    if (type === 'report_problem') return 'แจ้งปัญหา';
    if (type === 'request_point') return 'ขอจุดใหม่';
    return type;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ปฏิเสธ';
      case 'pending': return 'รอดำเนินการ';
      default: return status;
    }
  }
}

