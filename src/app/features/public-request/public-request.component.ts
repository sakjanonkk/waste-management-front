import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RequestService } from '../../core/services/request/request.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

declare const google: any;

@Component({
  selector: 'app-public-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    DecimalPipe,
  ],
  templateUrl: './public-request.component.html',
  styleUrls: ['./public-request.component.scss'],
})
export class PublicRequestComponent implements OnInit, AfterViewInit {
  requestForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;
  selectedAddress = '';

  private map: any = null;
  private marker: any = null;

  constructor(
    private fb: FormBuilder,
    private requestService: RequestService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 500);
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      request_type: ['report_problem', Validators.required],
      point_name: [''],
      latitude: [null],
      longitude: [null],
      remarks: [''],
      reporter_name: [''],
      reporter_contact: [''],
    });
  }

  private initMap(): void {
    const mapElement = document.getElementById('public-request-map');
    if (!mapElement || typeof google === 'undefined') {
      console.warn('Google Maps not available');
      return;
    }

    // Default center (Bangkok)
    const defaultCenter = { lat: 13.7563, lng: 100.5018 };

    this.map = new google.maps.Map(mapElement, {
      center: defaultCenter,
      zoom: 12,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] }
      ],
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Click to place marker
    this.map.addListener('click', (event: any) => {
      this.placeMarker(event.latLng);
    });
    
    // Initialize Places Autocomplete
    this.initPlacesAutocomplete();
  }
  
  private initPlacesAutocomplete(): void {
    const searchInput = document.getElementById('place-search-input') as HTMLInputElement;
    if (!searchInput) return;
    
    const autocomplete = new google.maps.places.Autocomplete(searchInput, {
      componentRestrictions: { country: 'th' }, // Restrict to Thailand
      fields: ['geometry', 'name', 'formatted_address']
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        
        // Move map to selected place
        this.map.panTo(location);
        this.map.setZoom(16);
        
        // Place marker
        this.placeMarker(location);
        
        // Optionally update point_name with place name
        if (place.name) {
          this.requestForm.patchValue({ point_name: place.name });
        }
        
        // Update address
        if (place.formatted_address) {
          this.selectedAddress = place.formatted_address;
        }
      }
    });
  }

  private placeMarker(location: any): void {
    const lat = location.lat();
    const lng = location.lng();

    // Update form
    this.requestForm.patchValue({
      latitude: lat,
      longitude: lng,
    });

    // Update or create marker
    if (this.marker) {
      this.marker.setPosition(location);
    } else {
      this.marker = new google.maps.Marker({
        position: location,
        map: this.map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#2d7a2e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 12,
        },
      });

      // Allow dragging marker
      this.marker.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        this.requestForm.patchValue({ latitude: lat, longitude: lng });
        this.fetchAddress(lat, lng);
      });
    }

    // Fetch address
    this.fetchAddress(lat, lng);
  }

  private async fetchAddress(lat: number, lng: number): Promise<void> {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        this.selectedAddress = response.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      this.isLoading = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          this.requestForm.patchValue({ latitude: lat, longitude: lng });
          
          if (this.map) {
            const location = new google.maps.LatLng(lat, lng);
            this.map.panTo(location);
            this.map.setZoom(16);
            this.placeMarker(location);
          }
          
          this.isLoading = false;
          this.snackBar.open('ดึงตำแหน่งสำเร็จ', 'ปิด', { duration: 3000 });
        },
        (error) => {
          this.isLoading = false;
          let errorMsg = 'ไม่สามารถดึงตำแหน่งได้';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์';
          }
          this.snackBar.open(errorMsg, 'ปิด', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง', 'ปิด', { duration: 3000 });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(): void {
    this.imagePreview = null;
    this.selectedFile = null;
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.snackBar.open('กรุณากรอกข้อมูลให้ครบถ้วน', 'ปิด', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    const formValue = this.requestForm.value;

    // Append all text fields
    Object.keys(formValue).forEach((key) => {
      if (formValue[key] !== null && formValue[key] !== undefined) {
        formData.append(key, formValue[key]);
      }
    });

    // Append file if selected
    if (this.selectedFile) {
      formData.append('point_image', this.selectedFile);
    }

    this.requestService.createRequest(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open('ส่งคำร้องสำเร็จ! ขอบคุณที่แจ้งข้อมูล', 'ปิด', { duration: 5000 });
        this.resetForm();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Submit error:', err);
        this.snackBar.open('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'ปิด', { duration: 5000 });
      },
    });
  }

  resetForm(): void {
    this.requestForm.reset({ request_type: 'report_problem' });
    this.selectedFile = null;
    this.imagePreview = null;
    this.selectedAddress = '';
    
    // Remove marker
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
  }
}
