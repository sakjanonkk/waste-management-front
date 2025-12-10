import { Component, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StaffService } from '../../../core/services/staff/staff.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-staff-detail-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, RouterLink, NgxSkeletonLoaderModule],
  templateUrl: './staff-detail.component.html',
  styleUrls: ['./staff-detail.component.scss']
})
export class StaffDetailPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffService = inject(StaffService);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  loading = signal(true);
  staff = signal<any>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.isBrowser && id) {
      this.staffService.get(id).subscribe({
        next: (res) => {
          console.log('📸 Staff data from backend:', res.data);
          console.log('📸 Picture field:', res.data.picture);
          console.log('📸 s_image field:', res.data.s_image);
          this.staff.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  back() { this.router.navigate(['/staff']); }

  // Display helpers (formatting only)
  staffCode(): string {
    const s = this.staff();
    const num = typeof s?.id === 'number' ? s!.id : 0;
    return 'ST-' + num.toString().padStart(6, '0');
  }

  // แปลง relative path เป็น full URL
  getImageUrl(): string {
    const s = this.staff();
    const picture = s?.picture || s?.s_image;
    if (!picture) return '/assets/images/worker-avatar.png';
    
    // ถ้าเป็น relative path (/uploads/...) ให้เติม backend URL
    if (picture.startsWith('/uploads/')) {
      return 'https://waste.mysterchat.com' + picture;
    }
    
    return picture;
  }

  roleLabel(): string {
    const r = this.staff()?.role;
    const roleUpper = (r || '').toUpperCase();
    if (roleUpper === 'DRIVER') return 'พนักงานขับรถ';
    if (roleUpper === 'COLLECTOR') return 'พนักงานเก็บขยะ';
    if (roleUpper === 'ADMIN') return 'พนักงานวางเเผนเส้นทาง';
    return '-';
  }

  delete() {
    const s = this.staff();
    if (!s) return;
    
    if (!confirm(`ลบพนักงาน ${s.firstname} ${s.lastname}?`)) return;
    
    this.loading.set(true);
    this.staffService.delete(s.id).subscribe({
      next: () => {
        this.snack.open('ลบสำเร็จ', 'ปิด', { duration: 2000 });
        this.router.navigate(['/staff']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Delete error:', err);
        
        let errorMsg = 'ลบไม่สำเร็จ';
        if (err.error?.errors?.[0]?.message) {
          errorMsg = err.error.errors[0].message;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        
        this.snack.open(errorMsg, 'ปิด', { duration: 3000 });
      },
    });
  }
}
