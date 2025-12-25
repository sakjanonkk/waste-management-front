import { Component, Inject } from '@angular/core';
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
  template: `
    <h2 mat-dialog-title>รายละเอียดคำร้อง #{{ data.id }}</h2>
    <mat-dialog-content>
      <div class="detail-container">
        <!-- Image Section -->
        <div class="image-section" *ngIf="data.point_image">
          <img
            [src]="data.point_image"
            alt="Request Image"
            class="request-image"
          />
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <div class="info-row">
            <span class="label">ประเภท:</span>
            <span class="value">{{
              getRequestTypeName(data.request_type)
            }}</span>
          </div>
          <div class="info-row">
            <span class="label">สถานที่ / จุด:</span>
            <span class="value">{{ data.point_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">วันที่แจ้ง:</span>
            <span class="value">{{
              data.request_datetime | date : 'dd/MM/yyyy HH:mm'
            }}</span>
          </div>
          <div class="info-row">
            <span class="label">สถานะ:</span>
            <span class="value status-text" [ngClass]="data.status">{{
              getStatusLabel(data.status)
            }}</span>
          </div>

          <mat-divider style="margin: 1rem 0;"></mat-divider>

          <div class="info-row">
            <span class="label">ผู้แจ้ง:</span>
            <span class="value">{{ data.reporter_name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">เบอร์ติดต่อ:</span>
            <span class="value">{{ data.reporter_contact || '-' }}</span>
          </div>

          <div class="info-row" *ngIf="data.remarks">
            <span class="label">หมายเหตุ:</span>
            <span class="value">{{ data.remarks }}</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>ปิด</button>

      <ng-container *ngIf="data.status === 'pending'">
        <button mat-flat-button color="warn" (click)="onReject()">
          ปฏิเสธ
        </button>
        <button mat-flat-button color="primary" (click)="onApprove()">
          อนุมัติ
        </button>
      </ng-container>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .detail-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-top: 0.5rem;
      }

      .image-section {
        width: 100%;
        height: 250px;
        border-radius: 8px;
        overflow: hidden;
        background-color: #f3f4f6;
        display: flex;
        justify-content: center;
        align-items: center;

        .request-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      }

      .info-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .info-row {
        display: flex;
        justify-content: space-between;

        .label {
          font-weight: 500;
          color: #6b7280;
        }

        .value {
          font-weight: 600;
          color: #1f2937;
          text-align: right;
        }
      }

      .status-text.pending {
        color: #d97706;
      }
      .status-text.approved {
        color: #059669;
      }
      .status-text.rejected {
        color: #dc2626;
      }

      @media (min-width: 600px) {
        .detail-container {
          width: 450px;
        }
      }
    `,
  ],
})
export class RequestDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RequestDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onApprove(): void {
    this.dialogRef.close('approve');
  }

  onReject(): void {
    this.dialogRef.close('reject');
  }

  // Helpers (Duplicated from list, could be in util)
  getRequestTypeName(type: string): string {
    if (type === 'report_problem') return 'แจ้งปัญหา';
    if (type === 'request_point') return 'ขอจุดใหม่';
    return type;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'rejected':
        return 'ปฏิเสธ';
      case 'pending':
        return 'รอดำเนินการ';
      default:
        return status;
    }
  }
}
