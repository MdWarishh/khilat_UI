// src/app/app.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { Header }       from './components/header/header';
import { Footer }       from './components/footer/footer';
import { GuestService } from './services/guest.service';
import { CartService }  from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, Header, Footer],
  templateUrl: './app.html',
  styleUrl:    './app.css'
})
export class App implements OnInit, OnDestroy {

  cartCount    = 0;
  isAdminRoute = false;

  private cartSub!:   Subscription;
  private routerSub!: Subscription;

  constructor(
    private guestService: GuestService,
    private cartService:  CartService,
    private router:       Router
  ) {
    this.guestService.getOrCreateGuestId();
  }

  ngOnInit(): void {
    // Cart count — real-time
    this.cartSub = this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getTotalCount();
    });

    // Hide header/footer on admin routes
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.isAdminRoute = (e.urlAfterRedirects as string).startsWith('/admin');
      });

    // Set on initial load
    this.isAdminRoute = this.router.url.startsWith('/admin');
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }
}