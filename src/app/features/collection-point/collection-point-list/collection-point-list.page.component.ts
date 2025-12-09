import { Component, effect, inject, signal } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { PLATFORM_ID } from '@angular/core';
import { Router } from "@angular/router";
import { CollectionPoint } from '../../../shared/models/collection-point.model';
import { CollectionPointService } from '../../../core/services/collection-point/collection-point.service';
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";


@Component({
  selector: "app-collection-point-list-page",
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
],
  templateUrl: "./collection-point-list.page.component.html",
  styleUrl: "./collection-point-list.page.component.scss",
})
export class CollectionPointListPageComponent {
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private collectionPointService = inject(CollectionPointService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  data = signal<CollectionPoint[]>([]);
  total = signal<number>(0);

  // filters
  searchId = signal<string>('');
  searchName = signal<string>('');
  searchAddress = signal<string>('');
  status = signal<string>('');
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);

  displayedColumns = ['name', 'coordinates', 'address', 'regular_capacity', 'recycle_capacity', 'status', 'actions'];

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        this.fetch();
      });
    }
  }

  onSearchIdChange(value: string) {
    this.pageIndex.set(0);
    this.searchId.set(value);
    this.fetch();
  }

  onSearchNameChange(value: string) {
    this.pageIndex.set(0);
    this.searchName.set(value);
    this.fetch();
  }

  onSearchAddressChange(value: string) {
    this.pageIndex.set(0);
    this.searchAddress.set(value);
    this.fetch();
  }

  onStatusChange(value: string) {
    this.pageIndex.set(0);
    this.status.set(value);
    this.fetch();
  }

  onPageChange(evt: PageEvent) {
    this.pageIndex.set(evt.pageIndex);
    this.pageSize.set(evt.pageSize);
    this.fetch();
  }

  // ฟังก์ชันสำหรับดึงข้อมูล
  fetch() {
  if (!this.isBrowser) return;
  this.loading.set(true);
  this.error.set(null);

  // ส่ง page และ per_page ไปด้วย (page เริ่มจาก 1)
  this.collectionPointService.getAll(this.pageIndex() + 1, this.pageSize()).subscribe({
    next: (response) => {
      // ดึงข้อมูลจาก collection_points
      let filteredData: CollectionPoint[] = response.data.collection_points;

      if (this.searchId()) {
        filteredData = filteredData.filter((item: CollectionPoint) =>
          item.id.toString().includes(this.searchId())
        );
      }

      if (this.searchName()) {
        filteredData = filteredData.filter((item: CollectionPoint) =>
          item.name.toLowerCase().includes(this.searchName().toLowerCase())
        );
      }

      if (this.searchAddress()) {
        filteredData = filteredData.filter((item: CollectionPoint) =>
          item.address?.toLowerCase().includes(this.searchAddress().toLowerCase())
        );
      }

      if (this.status()) {
        filteredData = filteredData.filter((item: CollectionPoint) =>
          item.status === this.status()
        );
      }

      this.data.set(filteredData);
      this.total.set(response.data.pagination.total);
      this.loading.set(false);
    },
    error: () => {
      this.error.set('เกิดข้อผิดพลาดในการดึงข้อมูล');
      this.loading.set(false);
    }
  });
}
  // ฟังก์ชันสำหรับสร้างรายการใหม่
  goCreate() {
    this.router.navigate(["/collection-point/new"]);
  }

  // ฟังก์ชันสำหรับแก้ไข
  goEdit(row: CollectionPoint) {
    this.router.navigate(["/collection-point", row.id, "edit"]);
  }

  // ฟังก์ชันสำหรับดูรายละเอียด
  view(row: CollectionPoint) {
    this.router.navigate(["/collection-point", row.id]);
  }

  // ฟังก์ชันสำหรับลบ
  delete(row: CollectionPoint) {
    if (!confirm(`ต้องการลบจุดเก็บขยะ ${row.name}?`)) return;
    // TODO: เรียก service ลบข้อมูล
    this.snack.open("ลบสำเร็จ", "ปิด", { duration: 2000 });
    this.fetch();
  }

  // mapping status code to Thai label
  statusLabel(status: 'active' | 'inactive'): string {
    return status === 'active' ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน';
  }
}