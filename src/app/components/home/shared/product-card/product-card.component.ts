// product-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input() product!: any;
  @Input() visible   = false;
  @Input() animDelay = '0s';
  @Input() badgeLabel = '🔥 Trending';
  @Input() badgeClass = 'badge-trending';
  @Input() qty    = 1;
  @Input() inCart = false;

  @Output() productClick = new EventEmitter<number>();
  @Output() increment    = new EventEmitter<number>();
  @Output() decrement    = new EventEmitter<number>();
  @Output() addToCart    = new EventEmitter<any>();
}