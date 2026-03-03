// src/app/pages/cart/cart.component.ts
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
  isLoading = true;
  showClearConfirm = false;

  // Per-item error messages — used in cart.html via itemErrors[item.cartItemId]
  itemErrors: { [cartItemId: number]: string } = {};
  private errorTimers: { [cartItemId: number]: any } = {};

  private cartSub?: Subscription;

  constructor(private cartService: CartService) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartItems = items.filter(i => i.quantity > 0);
      this.isLoading = false;
    });

    this.cartService.fetchCart().subscribe({
      error: () => { this.isLoading = false; }
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    Object.values(this.errorTimers).forEach(t => clearTimeout(t));
  }

  // ── Error Message Helper ────────────────────────────────────────────────────

  private showItemError(cartItemId: number, msg: string): void {
    this.itemErrors = { ...this.itemErrors, [cartItemId]: msg };
    clearTimeout(this.errorTimers[cartItemId]);
    this.errorTimers[cartItemId] = setTimeout(() => {
      const { [cartItemId]: _, ...rest } = this.itemErrors;
      this.itemErrors = rest;
    }, 2500);
  }

  // ── Cart Actions ────────────────────────────────────────────────────────────

  increment(item: CartItem): void {
    if (item.quantity >= item.stockAvailable) {
      this.showItemError(item.cartItemId, `Only ${item.stockAvailable} in stock.`);
      return;
    }
    this.cartService.increment(item.variantId);
  }

  decrement(item: CartItem): void {
    // qty=1 pe bhi allow — service PUT decrease → backend delete karega
    this.cartService.decrement(item.variantId);
  }

  remove(cartItemId: number): void {
    this.cartService.removeItem(cartItemId);
  }

  confirmClear(): void { this.showClearConfirm = true; }
  cancelClear(): void  { this.showClearConfirm = false; }

  doClear(): void {
    this.showClearConfirm = false;
    this.cartService.clearCart().subscribe();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  getImageUrl(item: CartItem): string {
    if (!item.imageUrl) return '/assets/placeholder.jpg';
    if (item.imageUrl.startsWith('http')) return item.imageUrl;
    return `${environment.imageBaseUrl}/${item.imageUrl}`;
  }

  trackByCartItemId(_: number, item: CartItem): number {
    return item.cartItemId;
  }

  // ── Computed Totals ─────────────────────────────────────────────────────────

  get subtotal(): number {
    const raw = this.cartItems.reduce((sum, i) => sum + i.currentPrice * i.quantity, 0);
    return +raw.toFixed(2);
  }

  get itemCount(): number {
    return this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  }

  get deliveryCharge(): number {
    return this.subtotal >= 999 ? 0 : 99;
  }

  get grandTotal(): number {
    return +(this.subtotal + this.deliveryCharge).toFixed(2);
  }

  get formattedSubtotal(): string {
    return `₹${this.subtotal.toFixed(2)}`;
  }

  get formattedGrandTotal(): string {
    return `₹${this.grandTotal.toFixed(2)}`;
  }

  get formattedDelivery(): string {
    return this.deliveryCharge === 0 ? 'FREE' : `₹${this.deliveryCharge}`;
  }
}