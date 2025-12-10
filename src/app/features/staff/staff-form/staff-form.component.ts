import { Component, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffService } from '../../../core/services/staff/staff.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-staff-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule, MatIconModule, NgxSkeletonLoaderModule],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.scss']
})
export class StaffFormPageComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffService = inject(StaffService);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  id: number | null = null;
  isEdit = false;
  isView = false;
  loading = signal(false);
  isFetching = signal(false);
  hidePassword = true;

  form = this.fb.group({
    prefix: ['', Validators.required],
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', this.id ? [] : [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
    status: [''],
    phone_number: ['' , [Validators.required, Validators.pattern(/^\d{10}$/)]],
    s_image: [''], 
  });

  // เก็บไฟล์จริงไว้ส่งไป backend
  selectedImageFile: File | null = null;
  currentStaffData: any = null;

  constructor() {
    this.route.paramMap.subscribe(params => {
        const idStr = params.get('id');
        this.id = idStr ? Number(idStr) : null;
        
        const path = this.route.snapshot.routeConfig?.path || '';
        this.isEdit = path.includes('edit');
        this.isView = !!this.id && !this.isEdit; // Has ID but not editing

        this.initForm();
    });
  }

  initForm() {
    if (this.isBrowser && this.id) {
      this.isFetching.set(true);
      this.staffService.get(this.id).subscribe({
        next: (res) => {
          this.currentStaffData = res.data;
          const d = res.data;
          this.form.patchValue({
            prefix: d.prefix,
            firstname: d.firstname,
            lastname: d.lastname,
            email: d.email,
            role: (d.role || 'DRIVER').toUpperCase(), 
            status: (d.status || 'ACTIVE').toUpperCase(),
            phone_number: d.phone_number || '',
            s_image: d.s_image || '',
          });

          // Disable form in View mode
          if (this.isView) {
            this.form.disable();
          } else {
            this.form.enable();
            // Password validation logic update handled in submit or dynamic validators if needed
          }

          this.isFetching.set(false);
        },
        error: () => this.isFetching.set(false),
      });
    } else {
        // Reset for New mode
        this.form.enable();
    }
  }

  submit() {
    if (this.isView) return; // Should not happen but safety check

    // Fix prefix
    if (this.form.get('prefix')?.invalid && this.form.get('prefix')?.errors?.['required']) {
      this.form.patchValue({ prefix: '-' });
    }

    if (this.form.invalid) {
        console.log('Form Invalid:', this.form.errors);
        Object.keys(this.form.controls).forEach(key => {
            const control = this.form.get(key);
            if(control?.invalid) {
                console.log(`${key} invalid:`, control.errors);
            }
        });
        return this.form.markAllAsTouched();
    }
    
    const raw = this.form.getRawValue();

    const formData = new FormData();
    formData.append('prefix', raw.prefix ?? '-');
    formData.append('firstname', raw.firstname ?? '');
    formData.append('lastname', raw.lastname ?? '');
    formData.append('email', raw.email ?? '');
    formData.append('role', (raw.role ?? 'driver').toLowerCase());
    formData.append('status', (raw.status ?? 'active').toLowerCase());
    
    // Ensure phone number is clean (though validator checks digits)
    formData.append('phone_number', raw.phone_number ?? '');

    if (!this.id && raw.password) {
      formData.append('password', raw.password);
    } else if (this.isEdit && raw.password) {
        // Optional: allow password update in edit if needed, commonly backend ignores empty or check logic
        formData.append('password', raw.password);
    }
    
    if (this.selectedImageFile) {
      formData.append('picture', this.selectedImageFile);
    }

    const payload = formData;

    this.loading.set(true);
    const req = this.id
      ? this.staffService.update(this.id, payload)
      : this.staffService.create(payload);

    req.subscribe({
      next: (response) => {
        this.loading.set(false);
        this.snack.open('บันทึกสำเร็จ', 'ปิด', { duration: 2000 });
        this.router.navigate(['/staff']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error:', err);
        
        let errorMsg = 'บันทึกล้มเหลว';
        if (err.error?.errors?.[0]?.message) {
          errorMsg = err.error.errors[0].message;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.error) {
           errorMsg = err.error.error;
        }
        
        this.snack.open(errorMsg, 'ปิด', { duration: 3000 });
      },
    });
  }

  cancel() {
    this.router.navigate(['/staff']);
  }
  
  // Navigation for Edit button in View mode
  goToEdit() {
      if (this.id) {
        this.router.navigate(['/staff', this.id, 'edit']);
      }
  }

  delete() {
    if (!this.id || !this.currentStaffData) return;
    const s = this.currentStaffData;
    
    if (!confirm(`ลบพนักงาน ${s.firstname} ${s.lastname}?`)) return;
    
    this.loading.set(true);
    this.staffService.delete(this.id).subscribe({
      next: () => {
        this.snack.open('ลบสำเร็จ', 'ปิด', { duration: 2000 });
        this.router.navigate(['/staff']);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open('ลบไม่สำเร็จ', 'ปิด', { duration: 3000 });
      },
    });
  }

  // Used by CanDeactivate guard to warn on unsaved changes
  hasPendingChanges(): boolean {
    return this.form.dirty && !this.isView;
  }

  // Display helper for read-only employee code shown in the form header field
  staffCode(): string {
    const id = this.id;
    const num = typeof id === 'number' ? id : 0;
    return 'ST-' + num.toString().padStart(6, '0');
  }

  // ----- Image handlers (เฉพาะส่วนโปรไฟล์รูปภาพ) -----
  onImageFileSelected(evt: Event) {
    if (this.isView) return; // Prevent upload in view mode
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    
    // เก็บไฟล์จริงไว้ส่งไป backend
    this.selectedImageFile = file;
    
    // แปลงเป็น data URL เพื่อแสดง preview
    const reader = new FileReader();
    reader.onload = () => {
      this.form.patchValue({ s_image: reader.result as string });
      this.form.markAsDirty();
    };
    reader.readAsDataURL(file);
    
    // reset ค่าเดิมของ input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    input.value = '';
  }

  removeImage() {
    if (this.isView) return;
    this.selectedImageFile = null;
    this.form.patchValue({ s_image: '' });
    this.form.markAsDirty();
  }
  
  getImageUrl(): string {
      const picture = this.form.value.s_image || this.currentStaffData?.picture;
      if (!picture) return 'image/13.svg'; // Default placeholder
      
      // Check absolute path/data URI
      if (picture.startsWith('data:') || picture.startsWith('http')) {
          return picture;
      }
      
      // If relative from backend
      if (picture.startsWith('/uploads/')) {
          return 'https://waste.mysterchat.com' + picture;
      }
      
      return picture;
  }
}
