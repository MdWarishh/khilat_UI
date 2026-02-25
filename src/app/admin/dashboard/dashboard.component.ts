// admin/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterLink }        from '@angular/router';
import { HttpClient }        from '@angular/common/http';
import { forkJoin }          from 'rxjs';
import { environment }       from '../../../environments/environments';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  trending: string;
  category?: { id: number; name: string };
  productImages?: { imageUrl: string }[];
  image?: string;
}

interface Category {
  id: number;
  name: string;
}

interface ChartItem {
  name:    string;
  count:   number;
  percent: number;
  color:   string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ── State ──────────────────────────────────────
  today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  loadingProducts   = true;
  loadingCategories = true;

  // ── Real data ──────────────────────────────────
  latestProducts:  Product[]   = [];
  totalProducts    = 0;
  trendingCount    = 0;
  trendingPercent  = 0;
  totalCategories  = 0;
  categoryChartData: ChartItem[] = [];

  // ── Chart colors ────────────────────────────────
  private chartColors = [
    '#FF9494', '#FFB3B3', '#e87575', '#d4636a',
    '#FF7070', '#FFC4C4', '#c45c5c', '#ff8080',
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────

  private loadDashboardData(): void {

    // Load products + categories in parallel
    forkJoin({
      latest:   this.http.get<Product[]>(`${environment.apiUrl}/product/latest?limit=50`),
      trending: this.http.get<Product[]>(`${environment.apiUrl}/product/trending?limit=50`),
      cats:     this.http.get<Category[]>(`${environment.apiUrl}/categories`),
    }).subscribe({
      next: ({ latest, trending, cats }) => {

        // ── Products ──
        this.latestProducts = latest.map(p => ({ ...p, image: this.resolveImage(p) }));
        this.totalProducts  = latest.length;
        this.trendingCount  = trending.length;
        this.trendingPercent = this.totalProducts > 0
          ? (this.trendingCount / this.totalProducts) * 100
          : 0;
        this.loadingProducts = false;

        // ── Categories ──
        this.totalCategories = cats.length;
        this.buildCategoryChart(latest, cats);
        this.loadingCategories = false;
      },
      error: () => {
        // Load individually if forkJoin fails
        this.loadProductsOnly();
        this.loadCategoriesOnly();
      }
    });
  }

  private loadProductsOnly(): void {
    this.http.get<Product[]>(`${environment.apiUrl}/product/latest?limit=50`).subscribe({
      next: (products) => {
        this.latestProducts  = products.map(p => ({ ...p, image: this.resolveImage(p) }));
        this.totalProducts   = products.length;
        this.trendingCount   = products.filter(p => p.trending === 'y').length;
        this.trendingPercent = this.totalProducts > 0
          ? (this.trendingCount / this.totalProducts) * 100 : 0;
        this.loadingProducts = false;
      },
      error: () => { this.loadingProducts = false; }
    });
  }

  private loadCategoriesOnly(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (cats) => {
        this.totalCategories   = cats.length;
        this.buildCategoryChart(this.latestProducts, cats);
        this.loadingCategories = false;
      },
      error: () => { this.loadingCategories = false; }
    });
  }

  // ─────────────────────────────────────────────
  // CHART BUILDERS
  // ─────────────────────────────────────────────

  private buildCategoryChart(products: Product[], cats: Category[]): void {
    if (!cats.length || !products.length) return;

    // Count products per category
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const catName = p.category?.name || 'Uncategorized';
      counts[catName] = (counts[catName] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts));

    this.categoryChartData = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])         // Sort by count desc
      .slice(0, 8)                           // Max 8 bars
      .map(([name, count], i) => ({
        name,
        count,
        percent: maxCount > 0 ? (count / maxCount) * 100 : 0,
        color:   this.chartColors[i % this.chartColors.length],
      }));
  }

  // ─────────────────────────────────────────────
  // DONUT CHART (CSS conic-gradient)
  // ─────────────────────────────────────────────

  getDonutStyle(): string {
    const pct = Math.round(this.trendingPercent);
    return `background: conic-gradient(#FF9494 0% ${pct}%, #e2d9d0 ${pct}% 100%)`;
  }

  // ─────────────────────────────────────────────
  // IMAGE HELPER
  // ─────────────────────────────────────────────

  private resolveImage(product: Product): string {
    if (!product.productImages?.length) return '';
    const url = product.productImages[0].imageUrl;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.imageBaseUrl}${url}`;
  }
}