// home.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { Router }         from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product }        from '../../models/product.model';
import { environment }    from '../../../environments/environments';
import { GuestService } from '../../services/guest.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, AfterViewInit, OnDestroy {

  // ── Section refs for scroll-reveal ─────────────────────────────
  @ViewChild('categoriesSection') categoriesSection!: ElementRef;
  @ViewChild('trendingSection')   trendingSection!:   ElementRef;
  @ViewChild('newArrivalsSection') newArrivalsSection!: ElementRef;
  @ViewChild('whySection')        whySection!:         ElementRef;

  // ── Data ────────────────────────────────────────────────────────
  trendingProducts: Product[] = [];
  recentProducts:   Product[] = [];
  categories:       any[]     = [];
  pendingQuantities: { [productId: number]: number } = {};
    // temporary qty before adding to cart

  // ── Loading flags ───────────────────────────────────────────────
  loadingTrending   = true;
  loadingRecent     = true;
  loadingCategories = true;

  // ── Visibility flags (scroll-reveal) ────────────────────────────
  heroVisible        = false;
  catsVisible        = false;
  trendingVisible    = false;
  newArrivalsVisible = false;
  whyVisible         = false;

  // ── Hero slideshow ───────────────────────────────────────────────
  heroSlide  = 0;
  heroSlides: { image: string; tag: string; title: string }[] = [
    { image: 'assets/images/hero-1.png', tag: 'New Season', title: 'Summer Collection 2025' },
    { image: 'assets/images/hero-2.png', tag: 'Bestseller',  title: 'Premium Embroidery' },
    { image: 'assets/images/hero-3.png', tag: 'Sale',        title: 'Up to 40% Off' },
  ];
  private slideInterval: any;

  // ── Marquee offer items ──────────────────────────────────────────
  offerItems = [
    'Free Shipping above ₹999',
    'Easy 7-day Returns',
    'Authentic Handcrafted Designs',
    'New Arrivals Every Week',
    'COD Available',
    'Secure Payments',
  ];

  // ── Why Choose Us ─────────────────────────────────────────────
  features = [
    { icon: '🧵', title: 'Authentic Craftsmanship',  desc: 'Every kurti is handcrafted by skilled artisans using traditional techniques.' },
    { icon: '🚚', title: 'Free Delivery',             desc: 'Enjoy free shipping on all orders above ₹999. Pan India delivery.' },
    { icon: '↩️', title: 'Easy Returns',              desc: 'Hassle-free 7-day return policy. No questions asked.' },
    { icon: '🔒', title: 'Secure Payments',           desc: '100% secure checkout with all major payment options supported.' },
  ];

  // ── IntersectionObserver ─────────────────────────────────────────
  private observer!: IntersectionObserver;

private cartSub!: Subscription;

constructor(
  private productService:  ProductService,
  private categoryService: CategoryService,
  private cartService:     CartService,
  private router: Router
) {}

  ngOnInit(): void {
    this.loadTrending();
    this.loadRecent();
    this.loadCategories();
    this.startHeroSlider();

    // Trigger hero animation after a tick
    setTimeout(() => (this.heroVisible = true), 100);
  }

  ngAfterViewInit(): void {
    this.setupScrollReveal();
  }

 ngOnDestroy(): void {
  clearInterval(this.slideInterval);
  if (this.observer) this.observer.disconnect();
  if (this.cartSub)  this.cartSub.unsubscribe();
}


// ── Cart & Quantity Logic ─────────────────────────────────────────────

getProductQty(productId: number): number {
  if (this.isInCart(productId)) {
    return this.cartService.getItemQty(productId);
  }
  // Nahi to user ne jo pending select kiya hai (default 1)
  return this.pendingQuantities[productId] ?? 1;
}

isInCart(productId: number): boolean {
  return this.cartService.isInCart(productId);
}

incrementProductQty(productId: number): void {
  if (this.isInCart(productId)) {
    this.cartService.increment(productId);
  } else {
    const current = this.pendingQuantities[productId] ?? 1;
    this.pendingQuantities[productId] = current + 1;
  }
}

decrementProductQty(productId: number): void {
  if (this.isInCart(productId)) {
    this.cartService.decrement(productId);
  } else {
    const current = this.pendingQuantities[productId] ?? 1;
    if (current > 1) {
      this.pendingQuantities[productId] = current - 1;
    }
  }
}

addToCart(product: Product): void {
  const qty = this.getProductQty(product.id);

  if (this.isInCart(product.id)) {
    return;
  }

  for (let i = 0; i < qty; i++) {
    this.cartService.addItem({
      productId: product.id,
      name:      product.name,
      price:     product.price,
      // Fix: Use product.image[0] because product.image is now an array
      image:     (product.image && product.image.length > 0) ? product.image[0] : '',
      category:  product.category?.name || '',
    });
  }

  delete this.pendingQuantities[product.id];
}

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────

  private loadTrending(): void {
    this.productService.getTrendingProducts().subscribe({
      next: (products: Product[]) => {
        // Fix: Wrap the resolved image in an array [ ]
        this.trendingProducts = products.map(p => ({ 
          ...p, 
          image: [this.resolveImage(p)] 
        }));
        
        this.loadingTrending = false;

        if (products.length >= 3) {
          this.heroSlides = products.slice(0, 3).map((p, i) => ({
            image: this.resolveImage(p), // Hero slide uses a single string, this is fine
            tag:   i === 0 ? 'Trending Now' : i === 1 ? 'Bestseller' : 'Popular Pick',
            title: p.name,
          }));
        }
      },
      error: () => { this.loadingTrending = false; }
    });
  }

  private loadRecent(): void {
    this.productService.getRecentProducts().subscribe({
      next: (products: Product[]) => {
        // Fix: Wrap the resolved image in an array [ ]
        this.recentProducts = products.map(p => ({ 
          ...p, 
          image: [this.resolveImage(p)] 
        }));
        this.loadingRecent = false;
      },
      error: () => { this.loadingRecent = false; }
    });
  }

private loadCategories(): void {
  this.categoryService.getCategories().subscribe({
    next: (cats: any[]) => {
      this.categories = cats;
      this.loadingCategories = false;  // ✅ ye hai
    },
    error: () => { this.loadingCategories = false; }  // ✅ ye bhi hai
  });
}

  // ─────────────────────────────────────────────
  // IMAGE RESOLUTION
  // ─────────────────────────────────────────────

 private resolveImage(product: Product): string {
  if (!product.productImages || product.productImages.length === 0) {
    return ''; // Empty string, CSS handle karega
  }
  const url = product.productImages[0].imageUrl;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${environment.imageBaseUrl}${url}`;
} 

  // ─────────────────────────────────────────────
  // ROUTING
  // ─────────────────────────────────────────────

  goToProduct(id: number | string): void {
    this.router.navigate(['/products', id]);
  }

  // ─────────────────────────────────────────────
  // HERO SLIDER
  // ─────────────────────────────────────────────

  private startHeroSlider(): void {
    this.slideInterval = setInterval(() => {
      this.heroSlide = (this.heroSlide + 1) % this.heroSlides.length;
    }, 4000);
  }

  setHeroSlide(index: number): void {
    this.heroSlide = index;
    // Reset timer on manual click
    clearInterval(this.slideInterval);
    this.startHeroSlider();
  }

  // ─────────────────────────────────────────────
  // SCROLL REVEAL
  // ─────────────────────────────────────────────

  private setupScrollReveal(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el === this.categoriesSection?.nativeElement)  this.catsVisible = true;
          if (el === this.trendingSection?.nativeElement)    this.trendingVisible = true;
          if (el === this.newArrivalsSection?.nativeElement) this.newArrivalsVisible = true;
          if (el === this.whySection?.nativeElement)         this.whyVisible = true;
          this.observer.unobserve(el); // Fire only once
        });
      },
      { threshold: 0.15 }
    );

    const sections = [
      this.categoriesSection,
      this.trendingSection,
      this.newArrivalsSection,
      this.whySection,
    ];
    sections.forEach(s => { if (s?.nativeElement) this.observer.observe(s.nativeElement); });
  }

  // ─────────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────────

  getCatEmoji(name: string): string {
    const map: Record<string, string> = {
      kurta: '👗', kurti: '👗', anarkali: '🌸', palazzo: '✨',
      ethnic: '🪷',  casual: '🌿', festive: '🎉', cotton: '🌾',
      silk: '💎',   embroidery: '🧵', designer: '👑', sale: '🏷️',
    };
    const key = name.toLowerCase();
    for (const k of Object.keys(map)) {
      if (key.includes(k)) return map[k];
    }
    return '🛍️';
  }
}