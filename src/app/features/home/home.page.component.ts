import { Component, inject } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './home.page.component.html',
  styleUrl: './home.page.component.scss'
})
export class HomePageComponent {
  private router = inject(Router);

  // click handlers (empty by design)
  onCalculateTodayRoute(): void {}
  onStaffList(): void {
    this.router.navigate(['/staff']);
  }
  onVehicleList(): void {
    this.router.navigate(['/vehicle']);
  }
  onCollectionPoints(): void {}
  onCitizenRequests(): void {}
  onHistoryReports(): void {}
}
