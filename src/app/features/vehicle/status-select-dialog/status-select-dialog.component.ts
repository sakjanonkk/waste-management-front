import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface StatusSelectDialogData {
  currentStatus: string;
  vehicleRegNum: string;
}

export interface StatusSelectDialogResult {
  selectedStatus: string;
}

export interface VehicleStatusOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-status-select-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './status-select-dialog.component.html',
  styleUrl: './status-select-dialog.component.scss'
})
export class StatusSelectDialogComponent {
  private dialogRef = inject(MatDialogRef<StatusSelectDialogComponent>);
  data = inject<StatusSelectDialogData>(MAT_DIALOG_DATA);

  selectedStatus = this.data.currentStatus?.toLowerCase() || 'active';

  statusOptions: VehicleStatusOption[] = [
    {
      value: 'active',
      label: 'พร้อมใช้งาน',
      description: 'รถสามารถใช้งานได้ตามปกติ',
      icon: 'check_circle'
    },
    {
      value: 'in_maintenance',
      label: 'ซ่อมบำรุง',
      description: 'รถอยู่ระหว่างการซ่อมบำรุง',
      icon: 'build'
    },
    {
      value: 'decommissioned',
      label: 'ปลดประจำการ',
      description: 'รถไม่ได้ใช้งานแล้ว',
      icon: 'cancel'
    }
  ];

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    const result: StatusSelectDialogResult = {
      selectedStatus: this.selectedStatus
    };
    this.dialogRef.close(result);
  }
}
