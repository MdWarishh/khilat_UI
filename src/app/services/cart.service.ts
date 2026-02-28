// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    stock: number;
    trending: string;
    isActive: boolean;
    createdAt: string;
    productImages: string[];
    category: {
      id: number;
      name: string;
      description: string | null;
    };
  };
  quantity: number;
  price: number;
  cart: {
    id: number;
    guestId: string;
    createdAt: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly BASE_URL = 'http://localhost:8080/api/cart';
  private readonly GUEST_KEY = 'khilat_guest_id';

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Guest ID Management ──
  getGuestId(): string {
    let guestId = localStorage.getItem(this.GUEST_KEY);
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem(this.GUEST_KEY, guestId);
    }
    return guestId;
  }

  // ── Fetch cart from backend ──
  fetchCart(): Observable<CartItem[]> {
    const guestId = this.getGuestId();
    return this.http.get<CartItem[]>(`${this.BASE_URL}/${guestId}`).pipe(
      tap(items => this.cartSubject.next(items))
    );
  }

  // ── Add item ──
  addItem(productId: number, quantity: number = 1): Observable<any> {
    const guestId = this.getGuestId();
    const payload = { guestId, productId: String(productId), quantity: String(quantity) };
    return this.http.post(`${this.BASE_URL}/addcart`, payload).pipe(
      tap(() => this.fetchCart().subscribe())
    );
  }

  // ── Increment qty ──
  increment(productId: number): void {
    const item = this.cartSubject.value.find(i => i.product.id === productId);
    if (item) {
      this.addItem(productId, 1).subscribe();
    }
  }

  // ── Decrement qty ──
  decrement(productId: number): void {
    const item = this.cartSubject.value.find(i => i.product.id === productId);
    if (!item) return;
    if (item.quantity <= 1) {
      this.remove(productId);
    } else {
      this.addItem(productId, -1).subscribe();
    }
  }

  // ── Remove item ──
  remove(productId: number): void {
    const guestId = this.getGuestId();
    this.http.delete(`${this.BASE_URL}/${guestId}/${productId}`).subscribe({
      next: () => this.fetchCart().subscribe(),
      error: () => {
        // Fallback: remove locally if API fails
        const updated = this.cartSubject.value.filter(i => i.product.id !== productId);
        this.cartSubject.next(updated);
      }
    });
  }

  // ── Clear cart ──
  clearCart(): void {
    const guestId = this.getGuestId();
    this.http.delete(`${this.BASE_URL}/${guestId}`).subscribe({
      next: () => this.cartSubject.next([]),
      error: () => this.cartSubject.next([])
    });
  }

  // ── Helpers ──
  getItems(): CartItem[] { return this.cartSubject.value; }

  getTotalCount(): number {
    return this.cartSubject.value.reduce((s, i) => s + i.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartSubject.value.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  isInCart(productId: number): boolean {
    return this.cartSubject.value.some(i => i.product.id === productId);
  }

  getItemQty(productId: number): number {
    return this.cartSubject.value.find(i => i.product.id === productId)?.quantity || 0;
  }
}