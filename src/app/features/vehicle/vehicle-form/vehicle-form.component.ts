import { Component, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle/vehicle.service';
import { StaffService } from '../../../core/services/staff/staff.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface DriverOption {
  id: number;
  firstname: string;
  lastname: string;
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule, MatIconModule, MatRippleModule],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss'
})
export class VehicleFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleService = inject(VehicleService);
  private staffService = inject(StaffService);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  id = Number(this.route.snapshot.paramMap.get('id')) || null;
  loading = signal(false);
  drivers = signal<DriverOption[]>([]);

  form = this.fb.group({
    vehicle_reg_num: ['', Validators.required],
    vehicle_type: [''],
    status: ['active', Validators.required],
    fuel_category: ['DIESEL', Validators.required],
    regular_capacity: [0, [Validators.required, Validators.min(0)]],
    recycle_capacity: [0, [Validators.required, Validators.min(0)]],
    depreciation_thb: [0, [Validators.required, Validators.min(0)]],
    current_driver_id: [null as number | null],
    image_url: [''],
  });

  // เก็บไฟล์จริงไว้ส่งไป backend
  selectedImageFile: File | null = null;

  constructor() {
    // Fetch drivers for dropdown
    if (this.isBrowser) {
      this.staffService.list({ role: 'driver', per_page: 100 }).subscribe({
        next: (res: any) => {
          const staffs = res.data?.staffs ?? res.data ?? [];
          this.drivers.set(staffs.map((s: any) => ({
            id: s.id,
            firstname: s.firstname,
            lastname: s.lastname
          })));
        },
        error: () => this.drivers.set([])
      });
    }

    if (this.isBrowser && this.id) {
      this.loading.set(true);
      this.vehicleService.get(this.id).subscribe({
        next: (res) => {
          const d = res.data;
          this.form.patchValue({
            vehicle_reg_num: d.registration_number || d.vehicle_reg_num || '',
            vehicle_type: d.vehicle_type || '',
            status: d.status?.toLowerCase() || 'active',
            fuel_category: d.fuel_type?.toUpperCase() || 'DIESEL',
            regular_capacity: d.regular_waste_capacity_kg ?? d.regular_capacity ?? 0,
            recycle_capacity: d.recyclable_waste_capacity_kg ?? d.recycle_capacity ?? 0,
            depreciation_thb: d.depreciation_value_per_year ?? d.depreciation_thb ?? 0,
            current_driver_id: d.current_driver_id ?? null,
            image_url: d.image || d.image_url || '',
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  submit() {
    if (this.form.invalid) {
      console.log('❌ Form invalid:', this.form.errors);
      console.log('Form values:', this.form.value);
      return this.form.markAllAsTouched();
    }
    const raw = this.form.getRawValue();
    console.log('Raw form values:', raw);

    // ========== Payload สำหรับ Server จริง (Backend) แบบ FormData ==========
    const formData = new FormData();
    formData.append('registration_number', raw.vehicle_reg_num || '');
    formData.append('vehicle_type', raw.vehicle_type || 'Unknown'); 
    formData.append('status', raw.status ?? 'active');
    formData.append('regular_waste_capacity_kg', String(raw.regular_capacity ?? 0));
    formData.append('recyclable_waste_capacity_kg', String(raw.recycle_capacity ?? 0));
    const fuel = (raw.fuel_category ?? 'diesel').toLowerCase();
    formData.append('fuel_type', fuel);
    formData.append('depreciation_value_per_year', String(raw.depreciation_thb ?? 0));
    
    // Always send current_driver_id (even if null/0 to allow clearing driver)
    if (raw.current_driver_id !== null && raw.current_driver_id !== undefined && raw.current_driver_id > 0) {
      formData.append('current_driver_id', String(raw.current_driver_id));
    } else {
      formData.append('current_driver_id', '0'); // Send 0 to clear driver
    }
    
    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    console.log('Sending FormData...');

    this.loading.set(true);
    const req = this.id
      ? this.vehicleService.update(this.id, formData)
      : this.vehicleService.create(formData);

    req.subscribe({
      next: (response) => {
        this.loading.set(false);
        console.log('Save success:', response);
        this.snack.open('บันทึกสำเร็จ', 'ปิด', { duration: 2000 });
        this.router.navigate(['/vehicle']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error:', err);
        
        let errorMsg = 'บันทึกล้มเหลว';
        if (err.error?.errors?.[0]?.message) {
          errorMsg = err.error.errors[0].message;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        
        this.snack.open(errorMsg, 'ปิด', { duration: 3000 });
      },
    });
  }

  cancel() {
    this.router.navigate(['/vehicle']);
  }

  // ----- Image handlers -----
  onImageFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    
    // เก็บไฟล์จริงไว้ส่งไป backend
    this.selectedImageFile = file;
    
    // แปลงเป็น data URL เพื่อแสดง preview
    const reader = new FileReader();
    reader.onload = () => {
      this.form.patchValue({ image_url: reader.result as string });
      this.form.markAsDirty();
    };
    reader.readAsDataURL(file);
    
    // reset ค่าเดิมของ input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    input.value = '';
  }

  removeImage() {
    this.selectedImageFile = null;
    this.form.patchValue({ image_url: '' });
    this.form.markAsDirty();
  }
}
