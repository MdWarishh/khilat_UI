// all-products.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import { CartService } from '../../services/cart.service';

interface ProductVariant {
  id: number;
  size: string;
  price: number;
  stock: number;
}

interface ProductImage {
  id: number;
  imageUrl: string;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  trending: string;
  createdAt: string;
  isActive: boolean;
  category: Category;
  productImages: ProductImage[];
  variants: ProductVariant[];
}

interface PageResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.css',
})
export class AllProductsComponent implements OnInit, OnDestroy {

  products:      Product[] = [];
  loading        = true;
  cardsVisible   = false;

  // Pagination
  currentPage   = 0;
  totalPages    = 0;
  totalElements = 0;
  pageSize      = 10;
  pageNumbers:  number[] = [];

  // Filters
  filters = {
    keyword:  '',
    category: '',
    minPrice: null as number | null,
    maxPrice: null as number | null,
  };

  // UI state
  filterOpen  = false;
  viewMode: 'grid' | 'list' = 'grid';
  categories: string[] = [];
  skeletonArr = Array(10).fill(0);

  // Per-product cart state: productId → variant/state/error
  openDropdownId: number | null = null;

  private selectedVariants = new Map<number, ProductVariant>();
  private cartStates       = new Map<number, 'idle' | 'loading' | 'added'>();
  private cartErrors       = new Map<number, string>();
  private errorTimers      = new Map<number, any>();

  private searchSubject = new Subject<string>();
  private destroy$      = new Subject<void>();

  constructor(private http: HttpClient, private router: Router, private cartService: CartService) {}

  ngOnInit(): void {
    this.loadProducts();

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────
  // LOAD PRODUCTS
  // ─────────────────────────────────────────────

  loadProducts(): void {
    this.loading      = true;
    this.cardsVisible = false;

    let params = new HttpParams()
      .set('page', String(this.currentPage))
      .set('size', String(this.pageSize));

    if (this.filters.keyword)  params = params.set('keyword',  this.filters.keyword);
    if (this.filters.category) params = params.set('category', this.filters.category);
    if (this.filters.minPrice != null) params = params.set('minPrice', String(this.filters.minPrice));
    if (this.filters.maxPrice != null) params = params.set('maxPrice', String(this.filters.maxPrice));

    this.http.get<PageResponse>(`${environment.apiUrl}/product/getallproducts`, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.products      = res.content;
          this.totalElements = res.totalElements;
          this.totalPages    = res.totalPages;
          this.currentPage   = res.number;
          this.buildPageNumbers();
          this.extractCategories(res.content);
          this.loading = false;
          setTimeout(() => (this.cardsVisible = true), 60);
        },
        error: () => {
          this.loading  = false;
          this.products = [];
        }
      });
  }

  // ─────────────────────────────────────────────
  // FILTER HELPERS
  // ─────────────────────────────────────────────

  onSearchInput(): void {
    this.searchSubject.next(this.filters.keyword);
  }

  clearSearch(): void {
    this.filters.keyword = '';
    this.currentPage = 0;
    this.loadProducts();
  }

  setCategory(cat: string): void {
    this.filters.category = cat;
    this.currentPage = 0;
    this.loadProducts();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadProducts();
  }

  clearAllFilters(): void {
    this.filters = { keyword: '', category: '', minPrice: null, maxPrice: null };
    this.currentPage = 0;
    this.loadProducts();
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.keyword || this.filters.category ||
              this.filters.minPrice != null || this.filters.maxPrice != null);
  }

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  buildPageNumbers(): void {
    const total   = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2)        pages.push(-1); // ellipsis
      for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
      if (current < total - 3) pages.push(-1); // ellipsis
      pages.push(total - 1);
    }
    this.pageNumbers = pages;
  }

  // ─────────────────────────────────────────────
  // PRODUCT HELPERS
  // ─────────────────────────────────────────────

  getProductImage(product: Product): string {
    if (!product.productImages?.length) return '';
    const url = product.productImages[0].imageUrl;
    if (url.startsWith('http')) return url;
    return `${environment.imageBaseUrl}${url}`;
  }

  getVariantPriceRange(product: Product): string {
    const variants = product.variants;
    if (!variants?.length) return '';
    const prices = variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
  }

  getAvailableSizes(product: Product): string[] {
    return product.variants?.filter(v => v.stock > 0).map(v => v.size) ?? [];
  }

  isFullyOutOfStock(product: Product): boolean {
    const variants = product.variants;
    if (!variants?.length) return false;
    return variants.every(v => v.stock === 0);
  }

  isNew(createdAt: string): boolean {
    if (!createdAt) return false;
    const diffDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }

  goToProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }

  // Extract unique categories from loaded products for sidebar chips
  private extractCategories(products: Product[]): void {
    const seen = new Set<string>();
    products.forEach(p => { if (p.category?.name) seen.add(p.category.name); });
    this.categories = Array.from(new Set([...this.categories, ...seen]));
  }

  // ─────────────────────────────────────────────
  // CART — variant selection & add to cart
  // ─────────────────────────────────────────────

  toggleDropdown(productId: number): void {
    this.openDropdownId = this.openDropdownId === productId ? null : productId;
  }

  selectVariant(productId: number, variant: ProductVariant): void {
    this.selectedVariants.set(productId, variant);
    // Reset cart state when size changes
    this.cartStates.set(productId, 'idle');
    this.cartErrors.delete(productId);
  }

  getSelectedVariantId(productId: number): number | null {
    return this.selectedVariants.get(productId)?.id ?? null;
  }

  getSelectedVariant(productId: number): ProductVariant | null {
    return this.selectedVariants.get(productId) ?? null;
  }

  getCartState(productId: number): 'idle' | 'loading' | 'added' {
    return this.cartStates.get(productId) ?? 'idle';
  }

  getCartError(productId: number): string {
    return this.cartErrors.get(productId) ?? '';
  }

  // Price display — selected variant ka price, warna range
  getSelectedPrice(product: Product): string {
    const sv = this.selectedVariants.get(product.id);
    if (sv) return `₹${sv.price}`;
    const prices = product.variants?.map(v => v.price) ?? [];
    if (!prices.length) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
  }

  onAddToCart(product: Product): void {
    const variant = this.selectedVariants.get(product.id);
    if (!variant || this.cartStates.get(product.id) !== 'idle') return;

    this.cartStates.set(product.id, 'loading');
    this.cartErrors.delete(product.id);

    this.cartService.addItem(variant.id!, 1).subscribe({
      next: () => {
        this.cartStates.set(product.id, 'added');
        const t = setTimeout(() => {
          this.cartStates.set(product.id, 'idle');
        }, 2200);
        this.errorTimers.set(product.id, t);
      },
      error: (err: any) => {
        this.cartStates.set(product.id, 'idle');
        const msg = err?.error?.message || err?.error?.error || 'Could not add to cart';
        this.cartErrors.set(product.id, msg);
        const t = setTimeout(() => this.cartErrors.delete(product.id), 3000);
        this.errorTimers.set(product.id, t);
      }
    });
  }
}