import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { GuestService } from './services/guest.service';
import { CartService } from './services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  cartCount = 0;
  private sub!: Subscription;

  constructor(
    private guestService: GuestService,
    private cartService:  CartService
  ) {
    this.guestService.getOrCreateGuestId();
  }

  ngOnInit(): void {
    this.sub = this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getTotalCount();
    });
  }

  ngOnDestroy(): void { if (this.sub) this.sub.unsubscribe(); }
}