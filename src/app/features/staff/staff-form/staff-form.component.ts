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

@Component({
  selector: 'app-staff-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSnackBarModule, MatIconModule],
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

  id = Number(this.route.snapshot.paramMap.get('id')) || null;
  isEdit = this.route.snapshot.routeConfig?.path?.includes('edit') || false;
  loading = signal(false);
  hidePassword = true;

  form = this.fb.group({
    prefix: ['', Validators.required],
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', this.id ? [] : [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
    status: [''],
    phone_number: ['' , Validators.required , Validators.pattern(/^\d{10}$/)],
    s_image: [''], 
  });

  // เก็บไฟล์จริงไว้ส่งไป backend
  selectedImageFile: File | null = null;

  constructor() {
    if (this.isBrowser && this.id) {
      this.loading.set(true);
      this.staffService.get(this.id).subscribe({
        next: (res) => {
          const d = res.data;
          this.form.patchValue({
            prefix: d.prefix,
            firstname: d.firstname,
            lastname: d.lastname,
            email: d.email,
            role: (d.role || 'DRIVER').toUpperCase(), // แปลง role เป็น uppercase สำหรับ form
            status: (d.status || 'ACTIVE').toUpperCase(), // แปลง status เป็น uppercase สำหรับ form
            phone_number: d.phone_number || '',
            s_image: d.s_image || '',
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  submit() {
    if (this.form.get('prefix')?.invalid && this.form.get('prefix')?.errors?.['required']) {
      this.form.patchValue({ prefix: '-' });
    }

    if (this.form.invalid) return this.form.markAllAsTouched();
    const raw = this.form.getRawValue();

    const formData = new FormData();
    formData.append('prefix', raw.prefix ?? '-');
    formData.append('firstname', raw.firstname ?? '');
    formData.append('lastname', raw.lastname ?? '');
    formData.append('email', raw.email ?? '');
    formData.append('role', (raw.role ?? 'driver').toLowerCase());
    formData.append('status', (raw.status ?? 'active').toLowerCase());
    formData.append('phone_number', raw.phone_number ?? '');

    if (!this.id && raw.password) {
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

  // Used by CanDeactivate guard to warn on unsaved changes
  hasPendingChanges(): boolean {
    return this.form.dirty;
  }

  // Display helper for read-only employee code shown in the form header field
  staffCode(): string {
    const id = this.id;
    const num = typeof id === 'number' ? id : 0;
    return 'ST-' + num.toString().padStart(6, '0');
  }

  // ----- Image handlers (เฉพาะส่วนโปรไฟล์รูปภาพ) -----
  onImageFileSelected(evt: Event) {
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
    this.selectedImageFile = null;
    this.form.patchValue({ s_image: '' });
    this.form.markAsDirty();
  }
}
