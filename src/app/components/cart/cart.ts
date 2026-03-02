// cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  totalCount = 0;
  totalPrice = 0;
  isLoading  = true;
  private sub!: Subscription;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.sub = this.cartService.cart$.subscribe(items => {
      this.cartItems  = items;
      this.totalCount = this.cartService.getTotalCount();
      this.totalPrice = Math.round(this.cartService.getTotalPrice() * 100) / 100;
    });

    this.cartService.fetchCart().subscribe({
      next:  () => (this.isLoading = false),
      error: () => (this.isLoading = false)
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  increment(variantId: number): void { this.cartService.increment(variantId); }
  decrement(variantId: number): void { this.cartService.decrement(variantId); }
  remove(cartItemId: number): void   { this.cartService.removeItem(cartItemId); }
  clearCart(): void                  { this.cartService.clearCart(); }

  getImageUrl(item: CartItem): string {
    const imgs = item.variant?.product?.productImages;
    if (!imgs?.length) return '';
    const url = imgs[0].imageUrl;
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.imageBaseUrl}/${url}`;
  }

  getProductName(item: CartItem): string {
    return item.variant?.product?.name ?? 'Product';
  }

  getCategoryName(item: CartItem): string {
    return item.variant?.product?.category?.name ?? '';
  }

  get deliveryCharge(): number {
    return this.totalPrice >= 999 ? 0 : 99;
  }

  get grandTotal(): number {
    return Math.round((this.totalPrice + this.deliveryCharge) * 100) / 100;
  }
}