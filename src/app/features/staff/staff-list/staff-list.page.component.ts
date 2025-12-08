import {
  Component,
  ChangeDetectionStrategy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

import { StaffService } from '../../../core/services/staff/staff.service';
import { Staff, StaffRole } from '../../../shared/models/staff.model';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-staff-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './staff-list.page.component.html',
  styleUrl: './staff-list.page.component.scss',
})
export class StaffListPageComponent {
  private readonly staffService = inject(StaffService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // state
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<Staff[]>([]);
  readonly total = signal<number>(0);

  // filters
  readonly search = signal<string>('');
  readonly role = signal<string>('');   // DRIVER / COLLECTOR / ADMIN / ''
  readonly status = signal<string>(''); // ถ้ามี filter สถานะในอนาคต
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);

  readonly displayedColumns = [
    'prefix',
    'firstname',
    'lastname',
    'role',
    'phone',
    'actions',
  ];

  constructor() {
    if (!this.isBrowser) {
      // SSR: ไม่ต้องยิง fetch ตอน render ฝั่ง server
      return;
    }

    // จะยิง fetch ใหม่ทุกครั้งที่ filter / pagination เปลี่ยน
    effect(() => {
      // อ่านค่า signals เพื่อผูก dependency
      this.search();
      this.role();
      this.status();
      this.pageIndex();
      this.pageSize();

      this.fetch();
    });
  }

  onSearchChange(value: string): void {
    this.pageIndex.set(0);
    this.search.set(value);
    // effect จะเรียก fetch ให้อัตโนมัติ
  }

  onRoleChange(value: string): void {
    this.pageIndex.set(0);
    this.role.set(value);
  }

  onStatusChange(value: string): void {
    this.pageIndex.set(0);
    this.status.set(value);
  }

  onPageChange(evt: PageEvent): void {
    this.pageIndex.set(evt.pageIndex);
    this.pageSize.set(evt.pageSize);
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    const params = {
      search: this.search(),
      role: this.role() ? this.role().toLowerCase() : '',
      status: this.status() ? this.status().toLowerCase() : '',
      page: this.pageIndex() + 1,
      per_page: this.pageSize(),
    };

    this.staffService.list(params).subscribe({
      next: (res: any) => {
        const staffs = res.data?.staffs ?? [];
        const total = res.data?.pagination?.total ?? staffs.length;

        this.data.set(staffs);
        this.total.set(total);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('โหลดข้อมูลล้มเหลว');
        this.snack.open('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'ปิด', {
          duration: 3000,
        });
        console.error('Error loading staff:', err);
      },
    });
  }

  goCreate(): void {
    this.router.navigate(['/staff/new']);
  }

  goEdit(row: Staff): void {
    this.router.navigate(['/staff', row.id, 'edit']);
  }

  view(row: Staff): void {
    this.router.navigate(['/staff', row.id]);
  }

  delete(row: Staff): void {
    if (!confirm(`ลบพนักงาน ${row.firstname} ${row.lastname}?`)) return;

    this.staffService.delete(row.id).subscribe({
      next: () => {
        this.snack.open('ลบสำเร็จ', 'ปิด', { duration: 2000 });
        this.fetch(); // reload list
      },
      error: () => {
        this.snack.open('ลบไม่สำเร็จ', 'ปิด', { duration: 2000 });
      },
    });
  }

  // mapping role code to Thai label for table display
  roleLabel(role: StaffRole | string | ''): string {
    const roleUpper = (role || '').toUpperCase();
    if (roleUpper === 'DRIVER') return 'พนักงานขับรถ';
    if (roleUpper === 'COLLECTOR') return 'พนักงานเก็บขยะ';
    if (roleUpper === 'ADMIN') return 'พนักงานวางเเผนเส้นทาง';
    return '-';
  }
}