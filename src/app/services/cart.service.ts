// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  productId: number;
  name:      string;
  price:     number;
  image:     string;
  qty:       number;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly KEY = 'khilat_cart';
  private cartSubject  = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  cart$ = this.cartSubject.asObservable();

  getItems():      CartItem[] { return this.cartSubject.value; }
  getTotalCount(): number     { return this.cartSubject.value.reduce((s, i) => s + i.qty, 0); }
  getTotalPrice(): number     { return this.cartSubject.value.reduce((s, i) => s + i.price * i.qty, 0); }
  getItemQty(productId: number): number { return this.cartSubject.value.find(i => i.productId === productId)?.qty || 0; }
  isInCart(productId: number): boolean  { return this.getItemQty(productId) > 0; }

  addItem(item: Omit<CartItem, 'qty'>, qty = 1): void {
    const items = [...this.getItems()];
    const idx   = items.findIndex(i => i.productId === item.productId);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    else items.push({ ...item, qty });
    this.update(items);
  }

  increment(productId: number): void {
    this.update(this.getItems().map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
  }

  decrement(productId: number): void {
    this.update(this.getItems().map(i => i.productId === productId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
  }

  remove(productId: number): void { this.update(this.getItems().filter(i => i.productId !== productId)); }
  clearCart(): void { this.update([]); }

  private update(items: CartItem[]): void {
    this.cartSubject.next(items);
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }

  private loadFromStorage(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  }
}