import { Component, inject, signal, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { CollectionPoint } from '../../../shared/models/collection-point.model';
import { CollectionPointService } from '../../../core/services/collection-point/collection-point.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-collection-point-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
],
  templateUrl: './collection-point-detail.component.html',
  styleUrl: './collection-point-detail.component.scss'
})
export class CollectionPointDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private collectionPointService = inject(CollectionPointService);

  loading = signal<boolean>(true);
  point = signal<CollectionPoint | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchPoint(+id);
    }
  }

  fetchPoint(id: number) {
    this.loading.set(true);
    
    this.collectionPointService.getById(id).subscribe({
      next: (response) => {
        this.point.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching collection point:', err);
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/collection-point']);
  }

  goEdit() {
    const id = this.point()?.point_id;
    if (id) {
      this.router.navigate(['/collection-point', id, 'edit']);
    }
  }

  statusLabel(status: string): string {
    return status === 'ACTIVE' ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน';
  }

  statusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }
}
