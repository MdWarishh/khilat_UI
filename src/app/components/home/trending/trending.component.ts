// trending.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../shared/product-card/product-card.component';

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './trending.component.html',
  styleUrl: './trending.component.css',
})
export class TrendingComponent {
  @Input() products: any[]  = [];
  @Input() loading  = true;
  @Input() visible  = false;
  @Input() pendingQtys:    { [id: number]: number }  = {};
  @Input() cartedProducts: { [id: number]: boolean } = {};

  @Output() productClick = new EventEmitter<number>();
  @Output() increment    = new EventEmitter<number>();
  @Output() decrement    = new EventEmitter<number>();
  @Output() addToCart    = new EventEmitter<any>();

  getQty(id: number):    number  { return this.pendingQtys[id] ?? 1; }
  isInCart(id: number):  boolean { return !!this.cartedProducts[id]; }
}