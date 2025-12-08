import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1 class="not-found-title">404</h1>
        <h2 class="not-found-subtitle">Page Not Found</h2>
        <p class="not-found-message">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button mat-raised-button color="primary" (click)="goHome()">
          Go to Home
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: var(--mat-sys-surface-container-lowest);
    }
    
    .not-found-content {
      text-align: center;
    }
    
    .not-found-title {
      font-size: 9rem;
      font-weight: bold;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }
    
    .not-found-subtitle {
      font-size: 2.25rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 1rem;
    }
    
    .not-found-message {
      color: var(--mat-sys-on-surface-variant);
      margin-top: 1rem;
      margin-bottom: 2rem;
    }
  `]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
