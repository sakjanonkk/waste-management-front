import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../../core/services/request/request.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    NgxSkeletonLoaderModule,
    DatePipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
})
export class RequestListComponent implements OnInit {
  private requestService = inject(RequestService);
  private snackBar = inject(MatSnackBar);

  // Signals for state
  data = signal<any[]>([]);
  total = signal<number>(0);
  loading = signal<boolean>(true);

  // Filters
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);
  statusFilter = signal<string>('');
  typeFilter = signal<string>('');

  displayedColumns: string[] = [
    'id',
    'request_type',
    'point_name',
    'created_at',
    'status',
    'reporter',
    'actions',
  ];

  private dialog = inject(MatDialog);

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.loading.set(true);
    const params: any = {
      page: this.pageIndex() + 1,
      per_page: this.pageSize(),
    };

    if (this.statusFilter()) params.status = this.statusFilter();
    if (this.typeFilter()) params.request_type = this.typeFilter();

    this.requestService.getRequests(params).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.data.set(res.data.requests);
          this.total.set(res.data.pagination.total_rows);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error fetching requests:', err);
        this.loading.set(false);
        this.snackBar.open('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetchRequests();
  }

  onFilterChange() {
    this.pageIndex.set(0); // Reset to first page
    this.fetchRequests();
  }

  openManageDialog(request: any) {
    import('../request-detail-dialog/request-detail-dialog.component').then(
      (m) => {
        const dialogRef = this.dialog.open(m.RequestDetailDialogComponent, {
          data: request,
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          autoFocus: false,
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result === 'approve') {
            this.handleApprove(request.id);
          } else if (result === 'reject') {
            this.handleReject(request.id);
          }
        });
      }
    );
  }

  handleApprove(id: number) {
    this.requestService.approveRequest(id).subscribe({
      next: (res: any) => {
        this.snackBar.open('อนุมัติคำร้องเรียบร้อยแล้ว', 'ปิด', {
          duration: 3000,
        });
        this.fetchRequests();
      },
      error: (err: any) => {
        console.error('Error approving request:', err);
        this.snackBar.open('เกิดข้อผิดพลาดในการอนุมัติ', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  handleReject(id: number) {
    this.requestService.rejectRequest(id).subscribe({
      next: (res: any) => {
        this.snackBar.open('ปฏิเสธคำร้องเรียบร้อยแล้ว', 'ปิด', {
          duration: 3000,
        });
        this.fetchRequests();
      },
      error: (err: any) => {
        console.error('Error rejecting request:', err);
        this.snackBar.open('เกิดข้อผิดพลาดในการปฏิเสธ', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  // Helpers
  getRequestTypeName(type: string): string {
    if (type === 'report_problem') return 'แจ้งปัญหา';
    if (type === 'request_point') return 'ขอจุดใหม่';
    return type;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
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
