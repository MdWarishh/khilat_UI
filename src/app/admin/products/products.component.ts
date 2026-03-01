// admin/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment }       from '../../../environments/environments';

import {
  Product, Category, ProductPage,
  ProductFilters, ProductFormData
} from '../../models/product.model';

// Child components
import { ProductFiltersComponent }     from './product-filters/product-filters.component';
import { ProductTableComponent }       from './product-table/product-table.component';
import { ProductDetailModalComponent } from './product-detail-modal/product-detail-modal.component';
import { ProductFormModalComponent }   from './product-form-modal/product-form-modal.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    ProductFiltersComponent,
    ProductTableComponent,
    ProductDetailModalComponent,
    ProductFormModalComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl:    './products.component.css'
})
export class AdminProductsComponent implements OnInit {

  // ── Data ──────────────────────────────────────
  products:   Product[]  = [];
  categories: Category[] = [];

  // ── State ──────────────────────────────────────
  loading = true;
  saving  = false;
  error   = '';

  // ── Filters ────────────────────────────────────
  filters: ProductFilters = {
    searchQuery:    '',
    filterCategory: '',
    filterTrending: '',
    filterStatus:   '',
  };

  // ── Sort ───────────────────────────────────────
  sortField: 'name' | 'price' | 'stock' = 'name';
  sortDir:   'asc'  | 'desc'            = 'asc';

  // ── Pagination ─────────────────────────────────
  currentPage:   number   = 1;
  pageSize:      number   = 10;
  totalPages:    number   = 1;
  totalElements: number   = 0;
  startIndex:    number   = 0;
  endIndex:      number   = 0;
  pageNumbers:   number[] = [];

  // ── Modals ─────────────────────────────────────
  showDetails = false;
  showForm    = false;

  selectedProduct: Product | null = null;
  editingProduct:  Product | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  // ─────────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────────

  loadProducts(): void {
    this.loading = true;
    const headers = this.authHeaders();

    // Backend ko saare filters + sort + pagination ek saath bhejo
    let params = new HttpParams()
      .set('page',  String(this.currentPage - 1))  // backend 0-based page expect karta hai
      .set('size',  String(this.pageSize))
      .set('sort',  `${this.sortField},${this.sortDir}`);

    if (this.filters.searchQuery.trim())  params = params.set('search',   this.filters.searchQuery.trim());
    if (this.filters.filterCategory)      params = params.set('category', this.filters.filterCategory);
    if (this.filters.filterTrending)      params = params.set('trending', this.filters.filterTrending);
    if (this.filters.filterStatus)        params = params.set('status',   this.filters.filterStatus);

    this.http.get<ProductPage>(`${environment.apiUrl}/admin/getallproducts`, { headers, params })
      .subscribe({
        next: (res) => {
          this.products      = res.content;
          this.totalElements = res.totalElements;
          this.totalPages    = res.totalPages;
          this.startIndex    = (this.currentPage - 1) * this.pageSize;
          this.endIndex      = this.startIndex + res.content.length;
          this.buildPageNumbers();
          this.loading = false;
        },
        error: () => {
          this.error   = 'Failed to load products.';
          this.loading = false;
        }
      });
  }

  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories/getAllCategories`).subscribe({
      next:  (res) => { this.categories = res; },
      error: ()    => { console.warn('Could not load categories'); }
    });
  }

  // ─────────────────────────────────────────────
  // FILTER / SEARCH / SORT EVENTS (child se aate hain)
  // ─────────────────────────────────────────────

  onFiltersChange(newFilters: ProductFilters): void {
    this.filters = newFilters;
  }

  onSearch(): void {
    this.currentPage = 1;  // Search hone par page 1 par reset karo
    this.loadProducts();
  }

  onClearSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onClearAllFilters(): void {
    this.filters     = { searchQuery: '', filterCategory: '', filterTrending: '', filterStatus: '' };
    this.currentPage = 1;
    this.loadProducts();
  }

  onSort(field: 'name' | 'price' | 'stock'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir   = 'asc';
    }
    this.currentPage = 1;
    this.loadProducts();
  }

  // ─────────────────────────────────────────────
  // PAGINATION EVENTS
  // ─────────────────────────────────────────────

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadProducts();
  }

  onPageSizeChange(size: number): void {
    this.pageSize    = Number(size);
    this.currentPage = 1;
    this.loadProducts();
  }

  // ─────────────────────────────────────────────
  // MODAL OPEN/CLOSE
  // ─────────────────────────────────────────────

  openDetails(product: Product): void {
    this.selectedProduct = product;
    this.showDetails     = true;
  }

  openAddForm(): void {
    this.editingProduct = null;
    this.showForm       = true;
  }

  openEditForm(product: Product): void {
    this.editingProduct = product;
    this.showDetails    = false;  // detail modal band karo
    this.showForm       = true;
  }

  closeForm(): void {
    this.showForm       = false;
    this.editingProduct = null;
    this.error          = '';
  }

  // ─────────────────────────────────────────────
  // SAVE (ADD / EDIT)
  // ─────────────────────────────────────────────

  onFormSubmit(data: {
    formData:        ProductFormData;
    selectedFiles:   File[];
    deleteImageIds:  number[];
    primaryImageId:  number | null;
    reorderedImages: { id: number }[];
  }): void {

    const { formData } = data;
    if (!formData.name.trim() || !formData.price || !formData.categoryId) {
      this.error = 'Please fill all required fields (Name, Price, Category)';
      return;
    }

    this.saving = true;
    this.error  = '';

    const headers = this.authHeaders();
    const payload = new FormData();

    payload.append('product', JSON.stringify({
      name:        formData.name.trim(),
      description: formData.description.trim(),
      price:       formData.price,
      stock:       formData.stock,
      categoryId:  Number(formData.categoryId),
      trending:    formData.trending,
      isActive:    formData.isActive,
    }));

    data.selectedFiles.forEach(file => payload.append('images', file));

    if (this.editingProduct) {
      // Edit mode
      if (data.primaryImageId) payload.append('primaryImageId', String(data.primaryImageId));
      if (data.deleteImageIds.length) payload.append('deleteImageIds', data.deleteImageIds.join(','));

      this.http.post<Product>(
        `${environment.apiUrl}/admin/updateproduct/${this.editingProduct.id}`,
        payload, { headers }
      ).subscribe({
        next:  () => { this.onSaveSuccess(); },
        error: (err) => { this.onSaveError(err); }
      });

    } else {
      // Add mode
      this.http.post<Product>(
        `${environment.apiUrl}/admin/addproducts`,
        payload, { headers }
      ).subscribe({
        next:  () => { this.onSaveSuccess(); },
        error: (err) => { this.onSaveError(err); }
      });
    }
  }

  private onSaveSuccess(): void {
    this.saving = false;
    this.closeForm();
    this.loadProducts();
  }

  private onSaveError(err: any): void {
    this.saving = false;
    this.error  = err.error?.message || (this.editingProduct ? 'Failed to update product' : 'Failed to add product');
  }

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  deleteProduct(id: number): void {
    if (!confirm('Delete this product? This action cannot be undone.')) return;

    this.http.delete<string>(
      `${environment.apiUrl}/admin/deleteproduct/${id}`,
      { headers: this.authHeaders() }
    ).subscribe({
      next:  () => { this.loadProducts(); },
      error: () => { this.error = 'Failed to delete product.'; }
    });
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private buildPageNumbers(): void {
    const total   = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3)         pages.push(-1); // ellipsis
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push(-1); // ellipsis
      pages.push(total);
    }

    this.pageNumbers = pages;
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` });
  }
}