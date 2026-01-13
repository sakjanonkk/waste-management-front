import { Component, inject, signal, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CollectionPoint } from '../../../shared/models/collection-point.model';
import { CollectionPointService } from '../../../core/services/collection-point/collection-point.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MapPickerComponent } from '../../../shared/components/map-picker/map-picker.component';
import { LocationSelection } from '../../../shared/models/geocoding.model';
import { MapPickerInlineComponent } from '../../../shared/components/map-picker-inline/map-picker-inline.component';
import { RequestService } from '../../../core/services/request/request.service';

// ... (imports)
@Component({
  selector: 'app-collection-point-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MapPickerInlineComponent,
  ],
  templateUrl: './collection-point-form.component.html',
  styleUrl: './collection-point-form.component.scss'
})


export class CollectionPointFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private collectionPointService = inject(CollectionPointService);
  private requestService = inject(RequestService);
  private dialog = inject(MatDialog);

  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  imagePreview = signal<string | null>(null);
  selectedFile: File | null = null;
  
  isEditMode = false;
  pointId: number | null = null;

  pointForm: FormGroup = this.fb.group({
    point_name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    latitude: [null, [Validators.required]],
    longitude: [null, [Validators.required]],
    regular_capacity: [0, [Validators.required, Validators.min(0)]],
    recycle_capacity: [0, [Validators.required, Validators.min(0)]],
    problem_reported: [''],
    status: ['ACTIVE', [Validators.required]],
    point_image: ['']
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.pointId = +id;
      this.fetchPoint(+id);
    } else {
      // Check for query params from approved request
      this.route.queryParams.subscribe(params => {
        if (params['requestId']) {
          const requestId = +params['requestId'];
          this.fetchRequestDetails(requestId);
        }

        if (params['requestId'] || params['lat'] || params['lng']) {
          this.pointForm.patchValue({
            point_name: params['locationName'] || '',
            address: params['address'] || '',
            latitude: params['lat'] ? parseFloat(params['lat']) : null,
            longitude: params['lng'] ? parseFloat(params['lng']) : null,
          });
        }
      });
    }
  }

  fetchRequestDetails(id: number) {
    this.requestService.getRequestById(id).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          if (res.data.point_image) {
            this.imagePreview.set(res.data.point_image);
          }
        }
      },
      error: (err) => console.error('Error fetching request details:', err)
    });
  }

  fetchPoint(id: number) {
    this.loading.set(true);
    
    this.collectionPointService.getById(id).subscribe({
      next: (response) => {
        const point = response.data;
        this.pointForm.patchValue({
          point_name: point.name,
          address: point.address,
          latitude: point.latitude,
          longitude: point.longitude,
          regular_capacity: point.regular_capacity,
          recycle_capacity: point.recycle_capacity,
          problem_reported: point.problem_reported,
          status: point.status.toUpperCase(),
          point_image: point.image
        });
        
        if (point.image) {
          this.imagePreview.set(point.image);
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching collection point:', err);
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.imagePreview.set(null);
    this.selectedFile = null;
    this.pointForm.patchValue({ point_image: '' });
  }

  openMapPicker() {
    const dialogRef = this.dialog.open(MapPickerComponent, {
      width: '90vw',
      maxWidth: '900px',
      height: '80vh',
      maxHeight: '700px',
      disableClose: false,
      panelClass: 'map-picker-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result: LocationSelection | null) => {
      if (result) {
        // Update form with selected location
        this.pointForm.patchValue({
          latitude: result.latitude,
          longitude: result.longitude,
          address: result.address
        });
      }
    });
  }

  onMapLocationSelected(location: LocationSelection) {
    this.pointForm.patchValue({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });
  }

  onSubmit() {
    if (this.pointForm.invalid) {
      this.pointForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formValue = this.pointForm.value;

    // สร้าง FormData ให้ตรงกับ BE (ใช้ multipart/form-data)
    const formData = new FormData();
    formData.append('name', formValue.point_name || '');
    formData.append('address', formValue.address || '');
    formData.append('latitude', String(formValue.latitude || 0));
    formData.append('longitude', String(formValue.longitude || 0));
    formData.append('status', (formValue.status || 'active').toLowerCase());
    formData.append('problem_reported', formValue.problem_reported || '');
    formData.append('regular_capacity', String(formValue.regular_capacity || 0));
    formData.append('recycle_capacity', String(formValue.recycle_capacity || 0));
    
    // Handle image file
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const request$ = this.isEditMode && this.pointId
      ? this.collectionPointService.update(this.pointId, formData as any)
      : this.collectionPointService.create(formData as any);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/collection-point']);
      },
      error: (err: unknown) => {
        console.error('Error saving collection point:', err);
        this.submitting.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/collection-point']);
  }
}
