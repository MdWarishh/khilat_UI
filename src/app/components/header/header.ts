// header/header.component.ts
import { Component, inject, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private router      = inject(Router);

  isScrolled     = false;
  mobileMenuOpen = false;
  mobileCatOpen  = false;
  cartCount      = 0;
  cartBump       = false;

  private cartSub!: Subscription;
  private prevCount = 0;

  ngOnInit(): void {
    this.prevCount = this.cartService.getTotalCount();
    this.cartCount = this.prevCount;

    this.cartSub = this.cartService.cart$.subscribe(() => {
      const newCount = this.cartService.getTotalCount();
      if (newCount > this.prevCount) {
        this.cartBump = false;
        setTimeout(() => (this.cartBump = true), 10);
        setTimeout(() => (this.cartBump = false), 420);
      }
      this.prevCount = newCount;
      this.cartCount = newCount;
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  // Categories → home page #categories section scroll
  goToCategories(): void {
    this.closeMobileMenu();
    if (this.router.url === '/' || this.router.url === '') {
      this._scrollTo();
    } else {
      this.router.navigate(['/']).then(() => setTimeout(() => this._scrollTo(), 350));
    }
  }

  private _scrollTo(): void {
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) this.mobileCatOpen = false;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.mobileCatOpen  = false;
  }

  toggleMobileCategories(): void { this.mobileCatOpen = !this.mobileCatOpen; }

  @HostListener('window:scroll')
  onScroll(): void { this.isScrolled = window.scrollY > 20; }
}