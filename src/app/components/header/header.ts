import { Component, inject, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryService } from '../../services/category.service';
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
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);

  categories$ = this.categoryService.getCategories();

  isScrolled      = false;
  dropdownOpen    = false;
  mobileMenuOpen  = false;
  mobileCatOpen   = false;
  cartCount       = 0;

  private dropdownTimer: any;
  private cartSub!: Subscription;

  ngOnInit(): void {
    // Real-time cart count update
    this.cartSub = this.cartService.cart$.subscribe(() => {
      this.cartCount = this.cartService.getTotalCount();
    });

    // Initial count
    this.cartCount = this.cartService.getTotalCount();
  }

  ngOnDestroy(): void {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  openDropdown(): void {
    clearTimeout(this.dropdownTimer);
    this.dropdownOpen = true;
  }

  closeDropdown(): void {
    this.dropdownTimer = setTimeout(() => {
      this.dropdownOpen = false;
    }, 150);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) {
      this.mobileCatOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.mobileCatOpen  = false;
    this.dropdownOpen   = false;
  }

  toggleMobileCategories(): void {
    this.mobileCatOpen = !this.mobileCatOpen;
  }
}