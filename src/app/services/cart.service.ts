// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface CartItem {
  cartItemId: number;
  productId: number;
  variantId: number;
  productName: string;
  imageUrl: string;
  size: string;
  quantity: number;
  stockAvailable: number;
  currentPrice: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly BASE_URL = `${environment.apiUrl}/cart`;
  private readonly GUEST_KEY = 'guest_id';

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  // In-flight API call tracker — prevents race conditions on rapid clicks
  private pendingCalls = new Map<number, boolean>();

  constructor(private http: HttpClient) {}

  // ── Guest ID ────────────────────────────────────────────────────────────────

  getGuestId(): string {
    try {
      let guestId = localStorage.getItem(this.GUEST_KEY);
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem(this.GUEST_KEY, guestId);
      }
      return guestId;
    } catch {
      // Fallback for SSR / private browsing
      if (!(this as any)._fallbackGuestId) {
        (this as any)._fallbackGuestId = crypto.randomUUID();
      }
      return (this as any)._fallbackGuestId;
    }
  }

  // ── Fetch Cart ──────────────────────────────────────────────────────────────

  fetchCart(): Observable<CartItem[]> {
    const guestId = this.getGuestId();
    return this.http.get<CartItem[]>(`${this.BASE_URL}/${guestId}`).pipe(
      tap(items => this.cartSubject.next(items.filter(i => i.quantity > 0)))
    );
  }

  // ── Add New Item (Product Page se) ─────────────────────────────────────────
  // Uses POST /addcart — only for adding a NEW item to cart

  addItem(variantId: number, quantity: number = 1): Observable<any> {
    const payload = {
      guestId:   this.getGuestId(),
      quantity:  String(quantity),
      variantId: String(variantId)
    };
    return this.http.post(`${this.BASE_URL}/addcart`, payload, { responseType: 'text' }).pipe(
      tap(() => this.fetchCart().subscribe())
    );
  }

  // ── Increment ───────────────────────────────────────────────────────────────
  // Uses PUT /item/{cartItemId}/increase — backend quantity +1 karta hai

  increment(variantId: number): void {
    const snapshot = this.cartSubject.value;
    const item = snapshot.find(i => i.variantId === variantId);
    if (!item) return;

    // Stock limit guard
    if (item.quantity >= item.stockAvailable) return;

    // Race condition guard — ek hi call at a time per item
    if (this.pendingCalls.get(variantId)) return;
    this.pendingCalls.set(variantId, true);

    // 1. Optimistic UI update immediately
    this.cartSubject.next(
      snapshot.map(i =>
        i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );

    // 2. Correct backend endpoint: PUT /item/{cartItemId}/increase
    this.http.put(`${this.BASE_URL}/item/${item.cartItemId}/increase`, {}, { responseType: 'text' })
      .subscribe({
        next: () => this.pendingCalls.delete(variantId),
        error: () => {
          this.pendingCalls.delete(variantId);
          this.cartSubject.next(snapshot); // revert on failure
        }
      });
  }

  // ── Decrement ───────────────────────────────────────────────────────────────
  // Uses PUT /item/{cartItemId}/decrease — backend quantity -1 karta hai
  // Agar backend quantity 0 kare toh item automatically delete hoga backend se
  // Frontend bhi optimistically remove karta hai jab qty = 1

  decrement(variantId: number): void {
    const snapshot = this.cartSubject.value;
    const item = snapshot.find(i => i.variantId === variantId);
    if (!item) return;

    // Race condition guard
    if (this.pendingCalls.get(variantId)) return;
    this.pendingCalls.set(variantId, true);

    if (item.quantity <= 1) {
      // ── qty 1 → 0: Optimistic remove from UI immediately ──────────────────
      this.cartSubject.next(snapshot.filter(i => i.variantId !== variantId));

      // Backend decrease call — backend khud delete karega quantity 0 pe
      this.http.put(`${this.BASE_URL}/item/${item.cartItemId}/decrease`, {}, { responseType: 'text' })
        .subscribe({
          next: () => this.pendingCalls.delete(variantId),
          error: () => {
            this.pendingCalls.delete(variantId);
            this.cartSubject.next(snapshot); // revert — item wapas aayega
          }
        });

    } else {
      // ── qty > 1: Optimistic decrement ────────────────────────────────────
      this.cartSubject.next(
        snapshot.map(i =>
          i.variantId === variantId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );

      // Correct backend endpoint: PUT /item/{cartItemId}/decrease
      this.http.put(`${this.BASE_URL}/item/${item.cartItemId}/decrease`, {}, { responseType: 'text' })
        .subscribe({
          next: () => this.pendingCalls.delete(variantId),
          error: () => {
            this.pendingCalls.delete(variantId);
            this.cartSubject.next(snapshot); // revert on failure
          }
        });
    }
  }

  // ── Remove Item ─────────────────────────────────────────────────────────────
  // Direct remove button ke liye — uses DELETE /{guestId}/{cartItemId}

  removeItem(cartItemId: number): void {
    const snapshot = this.cartSubject.value;
    const guestId = this.getGuestId();

    // Optimistic remove
    this.cartSubject.next(snapshot.filter(i => i.cartItemId !== cartItemId));

    this.http.delete(`${this.BASE_URL}/${guestId}/${cartItemId}`).subscribe({
      error: () => this.cartSubject.next(snapshot) // revert on failure
    });
  }

  removeByVariant(variantId: number): void {
    const item = this.cartSubject.value.find(i => i.variantId === variantId);
    if (item) this.removeItem(item.cartItemId);
  }

  // ── Clear Cart ──────────────────────────────────────────────────────────────

  clearCart(): Observable<any> {
    const guestId = this.getGuestId();
    const snapshot = this.cartSubject.value;

    // Optimistic clear
    this.cartSubject.next([]);

    return this.http.delete(`${this.BASE_URL}/${guestId}`).pipe(
      catchError(err => {
        this.cartSubject.next(snapshot); // revert on failure
        return throwError(() => err);
      })
    );
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  getItems(): CartItem[] {
    return this.cartSubject.value;
  }

  getTotalCount(): number {
    return this.cartSubject.value.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTotalPrice(): number {
    const raw = this.cartSubject.value.reduce(
      (sum, i) => sum + i.currentPrice * i.quantity, 0
    );
    return +raw.toFixed(2);
  }

  isInCart(variantId: number): boolean {
    return this.cartSubject.value.some(i => i.variantId === variantId);
  }
}