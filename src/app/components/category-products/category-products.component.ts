// category-products.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environments';

interface ProductImage {
  id: number;
  imageUrl: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  trending: string;
  isActive: boolean;
  productImages: ProductImage[];
  category: { id: number; name: string; description: string };
}

interface ApiResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
}

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-products.component.html',
  styleUrl: './category-products.component.css',
})
export class CategoryProductsComponent implements OnInit, OnDestroy {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private http    = inject(HttpClient);
  private destroy = new Subject<void>();

  categoryName = '';
  categoryId   = 0;
  products: Product[] = [];
  loading      = true;
  error        = false;

  currentPage  = 0;
  totalPages   = 0;
  totalItems   = 0;
  pageSize     = 12;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy))
      .subscribe(params => {
        const newName = params['name'] ?? '';
        const newId   = +params['id'] || 0;

        if (newName !== this.categoryName || newId !== this.categoryId) {
          this.categoryName = newName;
          this.categoryId   = newId;
          this.currentPage  = 0;
          this.fetchProducts();
        }
      });
  }

  fetchProducts(): void {
    if (!this.categoryName) {
      this.error   = true;
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error   = false;

    const url = `${environment.apiUrl}/product/getallproducts`
      + `?category=${encodeURIComponent(this.categoryName)}`
      + `&page=${this.currentPage}`
      + `&size=${this.pageSize}`;

    this.http.get<ApiResponse>(url)
      .pipe(takeUntil(this.destroy))
      .subscribe({
        next: (res) => {
          this.products   = res.content;
          this.totalPages = res.totalPages;
          this.totalItems = res.totalElements;
          this.loading    = false;
        },
        error: () => {
          this.error   = true;
          this.loading = false;
        },
      });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  getFirstImage(product: Product): string {
    const imgUrl = product.productImages?.[0]?.imageUrl;
    if (!imgUrl) return '';
    // Already full URL hai (http/https) — seedha return karo
    if (imgUrl.startsWith('http')) return imgUrl;
    // Relative path hai (uploads/...) — baseUrl use karo, apiUrl nahi
    // baseUrl = http://localhost:8080 (bina /api ke)
    return `${environment.imageBaseUrl}${imgUrl}`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}