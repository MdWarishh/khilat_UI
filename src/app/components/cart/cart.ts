// cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnInit, OnDestroy {

  cartItems:  CartItem[] = [];
  totalCount: number     = 0;
  totalPrice: number     = 0;
  private sub!: Subscription;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.sub = this.cartService.cart$.subscribe(items => {
      this.cartItems  = items;
      this.totalCount = this.cartService.getTotalCount();
      this.totalPrice = this.cartService.getTotalPrice();
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  increment(productId: number): void { this.cartService.increment(productId); }
  decrement(productId: number): void { this.cartService.decrement(productId); }
  remove(productId: number):    void { this.cartService.remove(productId); }
  clearCart():                  void { this.cartService.clearCart(); }
}