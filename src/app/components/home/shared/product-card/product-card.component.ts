// product-card.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent implements OnInit {
  @Input() product!: any;
  @Input() visible    = false;
  @Input() animDelay  = '0s';
  @Input() badgeLabel = '';
  @Input() badgeClass = 'badge-trending';
  @Input() inCart     = false;
  @Input() qty        = 1;

  @Output() productClick = new EventEmitter<number>();
  @Output() addToCart    = new EventEmitter<any>();
  @Output() increment    = new EventEmitter<number>();
  @Output() decrement    = new EventEmitter<number>();

  selectedSize: string = '';
  cartState: 'idle' | 'loading' | 'added' = 'idle';
  localQty     = 1;
  errorMsg     = '';
  notifySent   = false;

  private errorTimer: any;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    // Sync localQty from parent-passed qty
    this.localQty = this.qty ?? 1;

    // Auto-select first available size
    const first = this.product?.variants?.find((v: any) => v.stock > 0);
    if (first) this.selectedSize = first.size;
  }

  // ── Quantity ────────────────────────────────────────────────────────────────

  incrementQty(): void {
    const maxStock = this.selectedVariant?.stock ?? 99;
    if (this.localQty < maxStock) {
      this.localQty++;
      this.increment.emit(this.product?.id);
    }
  }

  decrementQty(): void {
    if (this.localQty > 1) {
      this.localQty--;
      this.decrement.emit(this.product?.id);
    }
  }

  // ── Computed getters ────────────────────────────────────────────────────────

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

  // Selected size ka stock 0 hai
  get isOutOfStock(): boolean {
    if (this.selectedVariant) return this.selectedVariant.stock === 0;
    return !this.product?.variants?.some((v: any) => v.stock > 0);
  }

  // Poora product out of stock — koi bhi variant available nahi
  get isFullyOutOfStock(): boolean {
    const variants = this.product?.variants;
    if (!variants?.length) return false;
    return variants.every((v: any) => v.stock === 0);
  }

  get stockLabel(): string {
    if (!this.selectedVariant) return '';
    if (this.selectedVariant.stock === 0) return 'Sold Out';
    if (this.selectedVariant.stock <= 5)  return `Only ${this.selectedVariant.stock} left`;
    return 'In Stock';
  }

  get stockClass(): string {
    if (!this.selectedVariant) return '';
    if (this.selectedVariant.stock === 0) return 'out-stock';
    if (this.selectedVariant.stock <= 5)  return 'low-stock';
    return 'in-stock';
  }

  // ── Notify Me ───────────────────────────────────────────────────────────────

  onNotifyMe(): void {
    // Future mein backend call yahan add karo
    this.notifySent = true;
    setTimeout(() => (this.notifySent = false), 4000);
  }

  // ── Error toast ─────────────────────────────────────────────────────────────

  private showError(msg: string): void {
    this.errorMsg = msg;
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => (this.errorMsg = ''), 3000);
  }

  // ── Add to Cart ─────────────────────────────────────────────────────────────

  onAddToCart(event: Event): void {
    event.stopPropagation();
    if (!this.selectedSize || this.isOutOfStock || this.cartState !== 'idle') return;

    this.cartState = 'loading';
    this.errorMsg  = '';

    const variantId = this.selectedVariant?.id as number;

    this.cartService.addItem(variantId, this.localQty).subscribe({
      next: () => {
        this.cartState = 'added';
        this.addToCart.emit({
          ...this.product,
          selectedSize:    this.selectedSize,
          selectedVariant: this.selectedVariant,
          quantity:        this.localQty,
        });
        this.localQty = 1;
        setTimeout(() => (this.cartState = 'idle'), 2000);
      },
      error: (err: any) => {
        this.cartState = 'idle';
        const msg = err?.error?.message || err?.error?.error || 'Could not add to cart. Please try again.';
        this.showError(msg);
      }
    });
  }
}