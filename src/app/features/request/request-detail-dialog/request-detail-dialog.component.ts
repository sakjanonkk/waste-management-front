import { Component, Inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-request-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './request-detail-dialog.component.html',
  styleUrls: ['./request-detail-dialog.component.scss'],
})
export class RequestDetailDialogComponent implements OnInit {
  addressFromCoords = signal<string>('');

  constructor(
    public dialogRef: MatDialogRef<RequestDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data.latitude && this.data.longitude) {
      this.fetchAddressFromCoords(this.data.latitude, this.data.longitude);
    }
  }

  private async fetchAddressFromCoords(lat: number, lng: number): Promise<void> {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results && response.results.length > 0) {
        const address = response.results[0].formatted_address;
        this.addressFromCoords.set(address);
        this.data.address = address;
      } else {
        this.addressFromCoords.set('ไม่พบที่อยู่');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      this.addressFromCoords.set('ไม่สามารถดึงที่อยู่ได้');
    }
  }

  onApprove(): void {
    this.dialogRef.close('approve');
  }

  onReject(): void {
    this.dialogRef.close('reject');
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  getRequestTypeName(type: string): string {
    if (type === 'report_problem') return 'แจ้งปัญหา';
    if (type === 'request_point') return 'ขอจุดใหม่';
    return type;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'อนุมัติแล้ว';
      case 'rejected': return 'ปฏิเสธ';
      case 'pending': return 'รอดำเนินการ';
      default: return status;
    }
  }
}
