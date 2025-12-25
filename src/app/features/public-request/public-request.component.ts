import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// import Swal from 'sweetalert2'; // Removed
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
  ],
  templateUrl: './public-request.component.html',
  styleUrls: ['./public-request.component.scss'],
})
export class PublicRequestComponent implements OnInit {
  requestForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private requestService: RequestService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.requestForm = this.fb.group({
      request_type: ['report_problem', Validators.required],
      point_name: [''],
      // point_image is handled by file input
      latitude: [null],
      longitude: [null],
      remarks: [''],
      reporter_name: [''],
      reporter_contact: [''],
    });

    // Optional: Add specific validation based on request_type if needed
    // e.g., point_name required if request_type is 'request_point'
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      this.isLoading = true; // Briefly show loading state for location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.requestForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          this.isLoading = false;
          this.snackBar.open(
            `ดึงพิกัดสำเร็จ: Lat ${position.coords.latitude}, Lng ${position.coords.longitude}`,
            'ปิด',
            { duration: 3000 }
          );
        },
        (error) => {
          this.isLoading = false;
          console.error('Error getting location', error);
          let errorMsg = 'ไม่สามารถดึงพิกัดได้';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg =
              'คุณปฏิเสธการเข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ในเบราว์เซอร์';
          }
          this.snackBar.open(errorMsg, 'ปิด', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง', 'ปิด', {
        duration: 3000,
      });
    }
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.snackBar.open('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'ปิด', {
        duration: 3000,
      });
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
        this.snackBar.open(
          'ส่งคำร้องสำเร็จ! ขอบคุณสำหรับการแจ้งข้อมูล',
          'ปิด',
          { duration: 5000 }
        );
        this.resetForm();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Submit error:', err);
        this.snackBar.open(
          'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง',
          'ปิด',
          { duration: 5000 }
        );
      },
    });
  }

  resetForm(): void {
    this.requestForm.reset({
      request_type: 'report_problem',
    });
    this.selectedFile = null;
    this.imagePreview = null;
  }
}
