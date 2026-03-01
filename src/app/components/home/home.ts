// home.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { GuestService } from '../../services/guest.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { environment } from '../../../environments/environments';

import { HeroComponent }        from './hero/hero.component';
import { OfferStripComponent }  from './offer-strip/offer-strip.component';
import { CategoriesComponent }  from './categories/categories.component';
import { TrendingComponent }    from './trending/trending.component';
import { OfferBannerComponent } from './offer-banner/offer-banner.component';
import { NewArrivalsComponent } from './new-arrivals/new-arrivals.component';
import { WhyUsComponent }       from './why-us/why-us.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    OfferStripComponent,
    CategoriesComponent,
    TrendingComponent,
    OfferBannerComponent,
    NewArrivalsComponent,
    WhyUsComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {

  // ── ViewChild refs for scroll reveal ──────────────────────────
  @ViewChild('categoriesSection')  private categoriesSection!:  ElementRef;
  @ViewChild('trendingSection')    private trendingSection!:    ElementRef;
  @ViewChild('newArrivalsSection') private newArrivalsSection!: ElementRef;
  @ViewChild('whySection')         private whySection!:         ElementRef;

  // ── Data ──────────────────────────────────────────────────────
  trendingProducts: Product[] = [];
  recentProducts:   Product[] = [];
  categories:       any[]     = [];

  // ── Cart state ────────────────────────────────────────────────
  pendingQuantities: { [id: number]: number }  = {};
  cartedProducts:    { [id: number]: boolean } = {};

  // ── Loading ───────────────────────────────────────────────────
  loadingTrending   = true;
  loadingRecent     = true;
  loadingCategories = true;

  // ── Scroll reveal ─────────────────────────────────────────────
  heroVisible        = false;
  catsVisible        = false;
  trendingVisible    = false;
  newArrivalsVisible = false;
  whyVisible         = false;

  // ── Hero slider ───────────────────────────────────────────────
  heroSlide  = 0;
  heroSlides: { image: string; tag: string; title: string }[] = [];

  private slideInterval: any;
  private observer!: IntersectionObserver;

  constructor(
    private productService:  ProductService,
    private categoryService: CategoryService,
    private cartService:     CartService,
    private guestService:    GuestService,
    private http:            HttpClient,
    private router:          Router,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    // ✅ FIXED: item.product.id instead of item.productId (new CartItem structure)
    this.cartService.getItems().forEach(item => {
      this.cartedProducts[item.product.id] = true;
    });

    this.loadCategories();
    this.loadTrending();
    this.loadRecent();

    setTimeout(() => (this.heroVisible = true), 100);
  }

  ngAfterViewInit(): void {
    this.setupScrollReveal();
  }

  ngOnDestroy(): void {
    clearInterval(this.slideInterval);
    this.observer?.disconnect();
  }

  // ── Cart ──────────────────────────────────────────────────────

  incrementQty(id: number): void {
    if (this.cartedProducts[id]) {
      this.cartService.increment(id);
    } else {
      this.pendingQuantities = { ...this.pendingQuantities, [id]: (this.pendingQuantities[id] ?? 1) + 1 };
    }
  }

  decrementQty(id: number): void {
    if (this.cartedProducts[id]) {
      this.cartService.decrement(id);
    } else {
      const cur = this.pendingQuantities[id] ?? 1;
      if (cur > 1) this.pendingQuantities = { ...this.pendingQuantities, [id]: cur - 1 };
    }
  }

  addToCart(product: Product): void {
    if (this.cartedProducts[product.id] || product.stock <= 0) return;

    const qty = this.pendingQuantities[product.id] ?? 1;

    // ✅ FIXED: cartService.addItem now takes (productId, quantity) — no object
    this.cartService.addItem(product.id, qty).subscribe({
      next: () => {
        // Remove from pending, mark as carted
        const { [product.id]: _, ...rest } = this.pendingQuantities;
        this.pendingQuantities = rest;
        this.cartedProducts    = { ...this.cartedProducts, [product.id]: true };
      },
      error: (err) => console.error('Add to cart failed:', err),
    });
  }

  // ── Routing ───────────────────────────────────────────────────

  goToProduct(id: number | string): void {
    this.router.navigate(['/products', id]);
  }

  // ── Hero slider ───────────────────────────────────────────────

  setHeroSlide(index: number): void {
    this.heroSlide = index;
    clearInterval(this.slideInterval);
    this.startSlider();
  }

  private startSlider(): void {
    clearInterval(this.slideInterval);
    this.slideInterval = setInterval(
      () => (this.heroSlide = (this.heroSlide + 1) % this.heroSlides.length),
      4000,
    );
  }

  // ── Data loading ──────────────────────────────────────────────

  private loadTrending(): void {
    this.productService.getTrendingProducts().subscribe({
      next: (products) => {
        this.trendingProducts = products.map(p => ({ ...p, image: [this.resolveImage(p)].filter((x): x is string => x !== null) }));
        this.loadingTrending  = false;

        const withImages = products.filter(p => this.resolveImage(p));
        if (withImages.length) {
          this.heroSlides = withImages.slice(0, 3).map((p, i) => ({
            image: this.resolveImage(p)!,
            tag:   ['Trending Now', 'Bestseller', 'Popular Pick'][i] ?? 'Trending',
            title: p.name,
          }));
          this.startSlider();
        }
      },
      error: () => (this.loadingTrending = false),
    });
  }

  private loadRecent(): void {
    this.productService.getRecentProducts().subscribe({
      next: (products) => {
        this.recentProducts = products.map(p => ({ ...p, image: [this.resolveImage(p)].filter((x): x is string => x !== null) }));
        this.loadingRecent  = false;
      },
      error: () => (this.loadingRecent = false),
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next:  (cats) => { this.categories = cats; this.loadingCategories = false; },
      error: ()     => (this.loadingCategories = false),
    });
  }

  // ── Scroll reveal ─────────────────────────────────────────────

  private setupScrollReveal(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        if (el === this.categoriesSection?.nativeElement)  this.catsVisible        = true;
        if (el === this.trendingSection?.nativeElement)    this.trendingVisible    = true;
        if (el === this.newArrivalsSection?.nativeElement) this.newArrivalsVisible = true;
        if (el === this.whySection?.nativeElement)         this.whyVisible         = true;
        this.observer.unobserve(el);
      });
    }, { threshold: 0.15 });

    [this.categoriesSection, this.trendingSection, this.newArrivalsSection, this.whySection]
      .forEach(s => s?.nativeElement && this.observer.observe(s.nativeElement));
  }

  // ── Util ──────────────────────────────────────────────────────

  private resolveImage(product: Product): string | null {
    if (!product.productImages?.length) return null;
    const url = product.productImages[0].imageUrl;
    if (!url || !url.trim()) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = environment.imageBaseUrl.replace(/\/$/, '');
    return base + (url.startsWith('/') ? url : '/' + url);
  }
}