import { Component, inject, signal, effect } from '@angular/core';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StaffService } from '../../../core/services/staff/staff.service';
import { Staff } from '../../../shared/models/staff.model';

export interface DriverSelectDialogData {
  currentDriverId: number | null;
}

export interface DriverSelectDialogResult {
  selectedDriver: Staff | null;
}

@Component({
  selector: 'app-driver-select-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
],
  templateUrl: './driver-select-dialog.component.html',
  styleUrl: './driver-select-dialog.component.scss'
})
export class DriverSelectDialogComponent {
  private dialogRef = inject(MatDialogRef<DriverSelectDialogComponent>);
  private staffService = inject(StaffService);
  public data = inject<DriverSelectDialogData>(MAT_DIALOG_DATA);

  loading = signal<boolean>(true);
  drivers = signal<Staff[]>([]);
  filteredDrivers = signal<Staff[]>([]);
  searchText = signal<string>('');
  selectedDriver = signal<Staff | null>(null);

  displayedColumns = ['select', 'code', 'name', 'role', 'phone'];

  constructor() {
    // Load all drivers (staff with role = 'driver')
    console.log('🚗 Requesting drivers with role=driver');
    this.staffService.list({ role: 'driver', per_page: 100 }).subscribe({
      next: (res: any) => {
        console.log('Driver list response:', res);
        // Server ส่ง: {success: true, data: {pagination: {...}, staffs: [...]}}
        const allStaffs = res.data?.staffs || [];
        
        // Filter เฉพาะ role = 'driver' เพราะ backend ไม่ได้กรอง
        const driverList = allStaffs.filter((staff: any) => 
          staff.role?.toLowerCase() === 'driver'
        );
        
        console.log('Total staff returned:', allStaffs.length);
        console.log('Filtered drivers only:', driverList.length);
        console.log('Driver roles:', driverList.map((d: any) => ({ id: d.id, name: d.firstname, role: d.role })));
        
        this.drivers.set(driverList);
        this.filteredDrivers.set(driverList);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.loading.set(false);
      }
    });

    // Filter effect
    effect(() => {
      const search = this.searchText().toLowerCase();
      const all = this.drivers();
      if (!search) {
        this.filteredDrivers.set(all);
      } else {
        const filtered = all.filter(d => 
          d.firstname?.toLowerCase().includes(search) ||
          d.lastname?.toLowerCase().includes(search) ||
          d.phone_number?.includes(search)
        );
        this.filteredDrivers.set(filtered);
      }
    });
  }

  onSearchChange(value: string) {
    this.searchText.set(value);
  }

  selectDriver(driver: Staff) {
    this.selectedDriver.set(driver);
  }

  isSelected(driver: Staff): boolean {
    return this.selectedDriver()?.id === driver.id;
  }

  isCurrent(driver: Staff): boolean {
    return driver.id === this.data.currentDriverId;
  }

  confirm() {
    const result: DriverSelectDialogResult = {
      selectedDriver: this.selectedDriver()
    };
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }

  staffCode(id: number): string {
    return 'ST-' + id.toString().padStart(6, '0');
  }
}
