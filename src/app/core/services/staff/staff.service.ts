/**
 * Service นี้เอาไว้เรียก REST API เกี่ยวกับ "พนักงาน" โดยซ่อนรายละเอียดการเรียก HTTP
 * ไว้หลังเมธ็อดที่อ่านง่าย เช่น list/get/create/update/delete
 *
 * หมายเหตุสำหรับมือใหม่:
 * - Service = ที่เก็บ logic ที่อยากใช้ซ้ำหลายหน้า (component)
 * - เราจะ inject service เข้าไปใน component แล้วเรียกใช้เมธ็อดต่างๆ ของ service นี้ได้
 */
import { inject, Injectable } from '@angular/core';
// @Injectable({ providedIn: 'root' }) = บอก Angular ว่า Service นี้สร้างได้จาก root injector
// ทำให้เราไม่ต้องไปเพิ่มใน providers ที่อื่น และสามารถ inject ใช้ได้ทั้งแอป

import { HttpClient, HttpParams } from '@angular/common/http';
// HttpClient = ตัวช่วยยิงคำขอ HTTP (GET/POST/PUT/DELETE)
// HttpParams = ตัวช่วยประกอบ query string (เช่น ?search=...&page=1)

import { Observable } from 'rxjs';
// Observable = ค่าที่จะส่งมาในอนาคต (async). เวลาจะใช้งานใน component มักจะ .subscribe(...) หรือใช้กับ async pipe

import { Staff, StaffListResponse, StaffResponse } from '../../../shared/models/staff.model';
// นำ type/interface มาใช้เพื่อให้โค้ดมี type ที่ชัดเจน (ช่วยเวลาเขียน/ refactor และลด bug)

@Injectable({ providedIn: 'root' })
export class StaffService {
  // วิธีใหม่ของ Angular ในการดึง dependency: "inject(...)" แทนการใช้ constructor
  private http = inject(HttpClient);

  // base path ของ API สำหรับ resource "staff"
  // ปล. ใน dev ถ้า backend เป็นคนละ origin ควรตั้ง proxy ให้ /api ชี้ไปที่ backend เพื่อลดปัญหา CORS
  private baseUrl = '/api/v1/staff';

  /**
   * ดึงรายการพนักงาน (มีตัวเลือก filter และ pagination)
   *
   * @param options ตัวเลือกสำหรับค้นหา/กรอง/แบ่งหน้า
   *  - search: คำค้นหา (ชื่อ/อีเมล/เบอร์โทร ฯลฯ)
   *  - role: กรองตามตำแหน่ง (เช่น DRIVER, COLLECTOR, ADMIN)
   *  - status: กรองตามสถานะ (ACTIVE/INACTIVE)
   *  - page: หน้าที่ต้องการ (เริ่ม 1)
   *  - limit: จำนวนต่อหน้า (เช่น 10)
   *  - per_page: จำนวนต่อหน้า (สำหรับ server จริง - ใช้แทน limit)
   * @returns Observable<StaffListResponse> ที่มีข้อมูลรายการพนักงานและอาจมี total กลับมา
   *
   * หมายเหตุ:
   * - HttpParams เป็น immutable (เปลี่ยนค่าแล้วได้ instance ใหม่) เลยต้องเขียนแบบ params = params.set(...)
   */
  list(options: { search?: string; role?: string; status?: string; page?: number; limit?: number; per_page?: number } = {}): Observable<StaffListResponse> {
    let params = new HttpParams();
    if (options.search) params = params.set('search', options.search);
    if (options.role) params = params.set('role', options.role);
    if (options.status) params = params.set('status', options.status);
    params = params.set('page', String(options.page ?? 1));
    
    // ใช้ per_page สำหรับ server จริง, limit สำหรับ mock
    if (options.per_page) {
      params = params.set('per_page', String(options.per_page));
    } else {
      params = params.set('limit', String(options.limit ?? 10));
    }
    
    return this.http.get<StaffListResponse>(this.baseUrl, { params });
  }

  /**
   * ดึงรายละเอียดพนักงานทีละคน
   * @param id หมายเลขพนักงาน
   * @returns Observable<StaffResponse> ที่มีข้อมูลพนักงาน 1 คน
   */
  get(id: number): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * สร้าง (เพิ่ม) พนักงานใหม่
   * @param payload ข้อมูลพนักงานที่จะส่งไปสร้าง (รองรับทั้ง object และ FormData)
   * @returns Observable<StaffResponse> ที่มีข้อมูลของรายการที่ถูกสร้างสำเร็จ
   */
  create(payload: Partial<Staff> | FormData): Observable<StaffResponse> {
    return this.http.post<StaffResponse>(this.baseUrl, payload);
  }

  /**
   * แก้ไขข้อมูลพนักงาน
   * @param id หมายเลขพนักงานที่จะแก้ไข
   * @param payload ค่าที่ต้องการอัปเดต (รองรับทั้ง object และ FormData)
   * @returns Observable<StaffResponse> ที่มีข้อมูลรายการหลังแก้ไข
   */
  update(id: number, payload: Partial<Staff> | FormData): Observable<StaffResponse> {
    return this.http.put<StaffResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * ลบพนักงานตาม id
   * @param id หมายเลขพนักงานที่ต้องการลบ
   * @returns Observable<any> (ส่วนมาก backend จะส่ง success message กลับมา)
   */
  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}

/**
 * ตัวอย่างการใช้งานใน Component (แนวคิดคร่าวๆ):
 *
 * import { Component, inject } from '@angular/core';
 * import { StaffService } from '.../core/services/staff.service';
 *
 * @Component({ ... })
 * export class StaffListPageComponent {
 *   private staffService = inject(StaffService);
 *
 *   load() {
 *     this.staffService.list({ search: 'john', page: 1, limit: 10 }).subscribe({
 *       next: (res) => {
 *         // ใช้ res.data แสดงผลในตาราง
 *       },
 *       error: (err) => {
 *         // แจ้งเตือน error ด้วย toast/snackbar
 *       }
 *     });
 *   }
 * }
 *
 * หมายเหตุ:
 * - อย่าลืม provide HttpClient ใน app (ไฟล์ app.config.ts มี provideHttpClient(withFetch()))
 * - ถ้า dev แล้วเรียก /api ไม่ถึง backend ให้ตั้ง proxy เพื่อชี้ /api → http://localhost:xxxx ของ backend
 */
