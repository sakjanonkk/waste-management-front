import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-truck-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './truck-loader.component.html',
  styleUrl: './truck-loader.component.scss'
})
export class TruckLoaderComponent implements OnInit {
  @Output() animationComplete = new EventEmitter<void>();

  ngOnInit(): void {
    // Animation takes 2.5 seconds, then emit complete
    setTimeout(() => {
      this.animationComplete.emit();
    }, 2500);
  }
}
