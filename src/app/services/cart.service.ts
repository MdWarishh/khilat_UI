// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';

// Backend response ke hisab se sahi interface
export interface CartVariant {
  id: number;
  size: string;
  price: number;
  stock: number;
  product?: {
    id: number;
    name: string;
    description: string;
    trending: string;
    isActive: boolean;
    createdAt: string;
    productImages: { id: number; imageUrl: string }[];
    category: { id: number; name: string; description: string | null };
  };
}

export interface CartItem {
  id: number;         // cart item id
  cart: {
    id: number;
    guestId: string;
    createdAt: string | null;
  };
  variant: CartVariant;
  quantity: number;
  price: number;      // variant price
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly BASE_URL = `${environment.apiUrl}/cart`;
  private readonly GUEST_KEY = 'guest_id';

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ── Guest ID ──
  getGuestId(): string {
    let guestId = localStorage.getItem(this.GUEST_KEY);
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem(this.GUEST_KEY, guestId);
    }
    return guestId;
  }

  // ── Fetch cart ──
  fetchCart(): Observable<CartItem[]> {
    const guestId = this.getGuestId();
    return this.http.get<CartItem[]>(`${this.BASE_URL}/${guestId}`).pipe(
      tap(items => this.cartSubject.next(items))
    );
  }

  // ── Add item ──
  addItem(productId: number, quantity: number = 1, variantId?: number): Observable<any> {
    const guestId = this.getGuestId();
    const payload: any = {
      guestId,
      productId: String(productId),
      quantity:  String(quantity)
    };
    if (variantId) payload.variantId = String(variantId);
    return this.http.post(`${this.BASE_URL}/addcart`, payload).pipe(
      tap(() => this.fetchCart().subscribe())
    );
  }

  // ── Increment ──
  increment(variantId: number): void {
    const item = this.cartSubject.value.find(i => i.variant.id === variantId);
    if (item) this.addItem(0, 1, variantId).subscribe();
  }

  // ── Decrement ──
  decrement(variantId: number): void {
    const item = this.cartSubject.value.find(i => i.variant.id === variantId);
    if (!item) return;
    if (item.quantity <= 1) {
      this.removeByVariant(variantId);
    } else {
      this.addItem(0, -1, variantId).subscribe();
    }
  }

  // ── Remove by cart item id ──
  removeItem(cartItemId: number): void {
    const guestId = this.getGuestId();
    this.http.delete(`${this.BASE_URL}/${guestId}/${cartItemId}`).subscribe({
      next:  () => this.fetchCart().subscribe(),
      error: () => {
        const updated = this.cartSubject.value.filter(i => i.id !== cartItemId);
        this.cartSubject.next(updated);
      }
    });
  }

  // ── Remove by variant id ──
  removeByVariant(variantId: number): void {
    const item = this.cartSubject.value.find(i => i.variant.id === variantId);
    if (item) this.removeItem(item.id);
  }

  // ── Clear cart ──
  clearCart(): void {
    const guestId = this.getGuestId();
    this.http.delete(`${this.BASE_URL}/${guestId}`).subscribe({
      next:  () => this.cartSubject.next([]),
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

  isInCart(variantId: number): boolean {
    return this.cartSubject.value.some(i => i.variant.id === variantId);
  }
}