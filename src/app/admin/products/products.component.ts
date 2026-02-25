// admin/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment }       from '../../../environments/environments';

interface Category {
  id:          number;
  name:        string;
  description: string;
}

interface ProductImage {
  id:       number;
  imageUrl: string;
}

export interface ProductPageResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
}

interface Product {
  id:            number;
  name:          string;
  description:   string;
  price:         number;
  stock:         number;
  trending:      string;
  isActive:      boolean;
  createdAt:     string;
  category?:     Category;
  productImages: ProductImage[];
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl:    './products.component.css'
})
export class AdminProductsComponent implements OnInit {

  totalElements: number = 0;

  // ── All Data ───────────────────────────────────
  allProducts:      Product[]  = [];
  filteredProducts: Product[]  = [];
  pagedProducts:    Product[]  = [];
  categories:       Category[] = [];

  // ── State ──────────────────────────────────────
  loading  = true;
  saving   = false;
  error    = '';

  // ── Filters ────────────────────────────────────
  searchQuery     = '';
  filterCategory  = '';
  filterTrending  = '';
  filterStatus    = '';

  // ── Sort ───────────────────────────────────────
  sortField: 'name' | 'price' | 'stock' = 'name';
  sortDir:   'asc'  | 'desc'            = 'asc';

  // ── Pagination ─────────────────────────────────
  currentPage = 1;
  pageSize    = 10;
  totalPages  = 1;
  startIndex  = 0;
  endIndex    = 0;
  pageNumbers: number[] = [];

  // ── Modals ─────────────────────────────────────
  showForm    = false;
  showDetails = false;

  selectedProduct: Product | null = null;
  editingProduct:  Product | null = null;
  activeImageIndex = 0;

  // ── Form ───────────────────────────────────────
  formData = {
    name:        '',
    description: '',
    price:       0,
    stock:       0,
    categoryId:  0,
    trending:    'n',
    isActive:    true,
  };

  selectedFiles:        File[]    = [];
  selectedFilesPreviews: string[] = [];
  deleteImageIds:       number[]  = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next:  (res) => { this.categories = res; },
      error: ()    => { console.warn('Could not load categories'); }
    });
  }

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────

  
  // 3. Update loadProducts to calculate endIndex correctly for the HTML
loadProducts(): void {
  this.loading = true;
  const headers = this.authHeaders();
  const params = `?page=${this.currentPage - 1}&size=${this.pageSize}`;

  this.http.get<ProductPageResponse>(`${environment.apiUrl}/admin/getallproducts${params}`, { headers })
    .subscribe({
      next: (res) => {
        this.pagedProducts = res.content; 
        this.totalElements = res.totalElements; // Make sure this property exists in your class
        this.totalPages = res.totalPages;
        
        // Manual calculation for the "Showing X-Y of Z" text
        this.startIndex = (this.currentPage - 1) * this.pageSize;
        this.endIndex = this.startIndex + this.pagedProducts.length;
        
        this.loading = false;
        this.buildPageNumbers();
      },
      error: () => {
        this.error = 'Failed to load products.';
        this.loading = false;
      }
    });
}
  

  // ─────────────────────────────────────────────
  // FILTERS + SORT + PAGINATION
  // ─────────────────────────────────────────────

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchQuery    = '';
    this.filterCategory = '';
    this.filterTrending = '';
    this.filterStatus   = '';
    this.currentPage    = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let list = [...this.allProducts];

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      );
    }

    // Category filter
    if (this.filterCategory) {
      list = list.filter(p => p.category?.id === Number(this.filterCategory));
    }

    // Trending filter
    if (this.filterTrending) {
      list = list.filter(p => p.trending === this.filterTrending);
    }

    // Status filter
    if (this.filterStatus) {
      list = list.filter(p =>
        this.filterStatus === 'active' ? p.isActive : !p.isActive
      );
    }

    // Sort
    list.sort((a, b) => {
      let va: any = a[this.sortField];
      let vb: any = b[this.sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    this.filteredProducts = list;
    this.updatePagination();
  }

  sort(field: 'name' | 'price' | 'stock'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir   = 'asc';
    }
    this.applyFilters();
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to page 1
    this.loadProducts();  // Call the API with the new size
  }
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadProducts(); // This is the fix! It must call the API
  }
  private updatePagination(): void {
    const total    = this.filteredProducts.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex   = Math.min(this.startIndex + this.pageSize, total);
    this.pagedProducts = this.filteredProducts.slice(this.startIndex, this.endIndex);
    this.buildPageNumbers();
  }

  private buildPageNumbers(): void {
    const total   = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3)          pages.push(-1);       // ellipsis
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2)  pages.push(-1);       // ellipsis
      pages.push(total);
    }

    this.pageNumbers = pages;
  }

  // ─────────────────────────────────────────────
  // MODALS
  // ─────────────────────────────────────────────

  openDetails(product: Product): void {
    this.selectedProduct  = product;
    this.activeImageIndex = 0;
    this.showDetails      = true;
  }

  openAddForm(): void {
    this.editingProduct = null;
    this.formData = { name: '', description: '', price: 0, stock: 0, categoryId: 0, trending: 'n', isActive: true };
    this.selectedFiles        = [];
    this.selectedFilesPreviews = [];
    this.deleteImageIds       = [];
    this.showForm = true;
  }

  openEditForm(product: Product): void {
    this.editingProduct = { ...product, productImages: [...(product.productImages || [])] };
    this.formData = {
      name:        product.name,
      description: product.description || '',
      price:       product.price,
      stock:       product.stock,
      categoryId:  product.category?.id || 0,
      trending:    product.trending || 'n',
      isActive:    product.isActive,
    };
    this.selectedFiles         = [];
    this.selectedFilesPreviews = [];
    this.deleteImageIds        = [];
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm       = false;
    this.editingProduct = null;
    this.selectedFiles         = [];
    this.selectedFilesPreviews = [];
    this.deleteImageIds        = [];
  }

  // ─────────────────────────────────────────────
  // IMAGE MANAGEMENT
  // ─────────────────────────────────────────────

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    this.addFiles(files);
  }

  private addFiles(files: File[]): void {
    files.forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.selectedFilesPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFilesPreviews.splice(index, 1);
  }

  toggleDeleteImage(id: number): void {
    const idx = this.deleteImageIds.indexOf(id);
    if (idx >= 0) this.deleteImageIds.splice(idx, 1);
    else          this.deleteImageIds.push(id);
  }

  isMarkedForDelete(id: number): boolean {
    return this.deleteImageIds.includes(id);
  }

  setPrimaryImage(index: number): void {
    if (!this.editingProduct) return;
    const imgs = this.editingProduct.productImages;
    const [moved] = imgs.splice(index, 1);
    imgs.unshift(moved);
  }

  // ─────────────────────────────────────────────
  // SUBMIT (ADD / EDIT)
  // ─────────────────────────────────────────────

  submitForm(): void {
    if (!this.formData.name.trim() || !this.formData.price || !this.formData.categoryId) {
      this.error = 'Please fill all required fields (Name, Price, Category)';
      return;
    }

    this.saving = true;
    this.error  = '';
    const headers = this.authHeaders();

    const payload = new FormData();
    payload.append('product', new Blob([JSON.stringify({
      name:        this.formData.name.trim(),
      description: this.formData.description.trim(),
      price:       this.formData.price,
      stock:       this.formData.stock,
      categoryId:  this.formData.categoryId,
      trending:    this.formData.trending,
      isActive:    this.formData.isActive,
    })], { type: 'application/json' }));

    this.selectedFiles.forEach(file => payload.append('images', file));

    if (this.editingProduct) {
      // Reorder info — send primary image id first
      const primaryId = this.editingProduct.productImages
        .filter(img => !this.deleteImageIds.includes(img.id))[0]?.id;
      if (primaryId) payload.append('primaryImageId', String(primaryId));
      if (this.deleteImageIds.length) payload.append('deleteImageIds', this.deleteImageIds.join(','));

      this.http.post<Product>(
        `${environment.apiUrl}/admin/updateproduct/${this.editingProduct.id}`,
        payload, { headers }
      ).subscribe({
        next:  () => { this.onSaveSuccess(); },
        error: (err) => { this.onSaveError(err); }
      });
    } else {
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

  resolveImage(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `${environment.imageBaseUrl}${imageUrl}`;
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` });
  }
}