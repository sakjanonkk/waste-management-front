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
    MatSelectModule
],
  templateUrl: './collection-point-form.component.html',
  styleUrl: './collection-point-form.component.scss'
})
export class CollectionPointFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private collectionPointService = inject(CollectionPointService);

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
    }
  }

  fetchPoint(id: number) {
    this.loading.set(true);
    
    this.collectionPointService.getById(id).subscribe({
      next: (response) => {
        const point = response.data;
        this.pointForm.patchValue({
          point_name: point.point_name,
          address: point.address,
          latitude: point.latitude,
          longitude: point.longitude,
          regular_capacity: point.regular_capacity,
          recycle_capacity: point.recycle_capacity,
          problem_reported: point.problem_reported,
          status: point.status,
          point_image: point.point_image
        });
        
        if (point.point_image) {
          this.imagePreview.set(point.point_image);
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

  onSubmit() {
    if (this.pointForm.invalid) {
      this.pointForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formData = this.pointForm.value;

    // If there's a selected file, you might want to upload it first
    // For now, we'll just use the preview URL or existing image URL
    if (this.imagePreview()) {
      formData.point_image = this.imagePreview();
    }

    const request$ = this.isEditMode && this.pointId
      ? this.collectionPointService.update(this.pointId, formData)
      : this.collectionPointService.create(formData);

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
