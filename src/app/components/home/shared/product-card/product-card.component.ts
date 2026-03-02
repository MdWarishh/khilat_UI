// product-card.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent implements OnInit {
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

  selectedSize: string = '';
  // 'idle' | 'loading' | 'added'
  cartState: 'idle' | 'loading' | 'added' = 'idle';

  ngOnInit(): void {
    const first = this.product?.variants?.find((v: any) => v.stock > 0);
    if (first) this.selectedSize = first.size;
  }

  get selectedVariant(): any {
    return this.product?.variants?.find((v: any) => v.size === this.selectedSize) ?? null;
  }

  get displayPrice(): string {
    if (this.selectedVariant) return `₹${this.selectedVariant.price}`;
    const prices = this.product?.variants?.map((v: any) => v.price) ?? [];
    if (!prices.length) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
  }

  get isOutOfStock(): boolean {
    if (this.selectedVariant) return this.selectedVariant.stock === 0;
    return !this.product?.variants?.some((v: any) => v.stock > 0);
  }

  get stockLabel(): string {
    if (!this.selectedVariant) return '';
    if (this.selectedVariant.stock === 0) return 'Sold Out';
    if (this.selectedVariant.stock <= 5) return `Only ${this.selectedVariant.stock} left`;
    return 'In Stock';
  }

  get stockClass(): string {
    if (!this.selectedVariant) return '';
    if (this.selectedVariant.stock === 0) return 'out-stock';
    if (this.selectedVariant.stock <= 5) return 'low-stock';
    return 'in-stock';
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    if (!this.selectedSize || this.isOutOfStock || this.cartState !== 'idle') return;

    this.cartState = 'loading';

    // Emit to parent — parent API call karega
    // Parent se response aane ka wait nahi kar sakte directly,
    // isliye 1.2s baad 'added' dikhao, fir 2s baad reset
    this.addToCart.emit({
      ...this.product,
      selectedSize: this.selectedSize,
      selectedVariant: this.selectedVariant,
    });

    setTimeout(() => {
      this.cartState = 'added';
      setTimeout(() => (this.cartState = 'idle'), 2000);
    }, 1200);
  }
}