import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {
  private categoryService = inject(CategoryService);

  categories$ = this.categoryService.getCategories();

  isScrolled      = false;
  dropdownOpen    = false;
  mobileMenuOpen  = false;
  mobileCatOpen   = false;
  cartCount       = 0;  // Replace with real cart service later

  private dropdownTimer: any;

  ngOnInit(): void {}

  // ── Scroll listener ──────────────────────────────────────────────
  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  // ── Desktop dropdown (hover with delay to avoid accidental close) ─
  openDropdown(): void {
    clearTimeout(this.dropdownTimer);
    this.dropdownOpen = true;
  }

  closeDropdown(): void {
    this.dropdownTimer = setTimeout(() => {
      this.dropdownOpen = false;
    }, 150);
  }

  // ── Mobile menu ───────────────────────────────────────────────────
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