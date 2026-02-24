// src/app/admin/products/products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Product } from '../../models/product.model'; // assume yeh model hai (id, name, price, description, images: {id, url}[] etc.)

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class AdminProductsComponent implements OnInit {

  products: Product[] = [];
  loading = true;
  error = '';

  
  showForm = false;
  editingProduct: Product | null = null;
  formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
  };
  selectedFiles: File[] = [];
  deleteImageIds: number[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    const token = localStorage.getItem('admin_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<Product[]>(`${environment.apiUrl}/admin/getallproducts`, { headers }).subscribe({
      next: (res) => {
        this.products = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products';
        this.loading = false;
        console.error(err);
      }
    });
  }

  openAddForm() {
    this.showForm = true;
    this.editingProduct = null;
    this.formData = { name: '', description: '', price: 0, stock: 0, categoryId: 0 };
    this.selectedFiles = [];
    this.deleteImageIds = [];
  }

  openEditForm(product: Product) {
    this.showForm = true;
    this.editingProduct = product;
    this.formData = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.category?.id || 0,   // ← category object ke andar id hai
    };
    this.selectedFiles = [];
    this.deleteImageIds = [];
  }

  onFileChange(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  onDeleteImage(id: number) {
    this.deleteImageIds.push(id);
  }

  submitForm() {
    const token = localStorage.getItem('admin_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const formDataPayload = new FormData();
    formDataPayload.append('product', new Blob([JSON.stringify(this.formData)], { type: 'application/json' }));

    this.selectedFiles.forEach(file => {
      formDataPayload.append('images', file);
    });

    if (this.editingProduct) {
      formDataPayload.append('deleteImageIds', this.deleteImageIds.join(','));
      const url = `${environment.apiUrl}/admin/updateproduct/${this.editingProduct.id}`;

      this.http.post<Product>(url, formDataPayload, { headers }).subscribe({
        next: (res) => {
          this.loadProducts();
          this.showForm = false;
        },
        error: (err) => {
          this.error = 'Failed to update product';
          console.error(err);
        }
      });
    } else {
      const url = `${environment.apiUrl}/admin/addproducts`;

      this.http.post<Product>(url, formDataPayload, { headers }).subscribe({
        next: (res) => {
          this.loadProducts();
          this.showForm = false;
        },
        error: (err) => {
          this.error = 'Failed to add product';
          console.error(err);
        }
      });
    }
  }

  deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('admin_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.delete<string>(`${environment.apiUrl}/admin/deleteproduct/${id}`, { headers }).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (err) => {
        this.error = 'Failed to delete product';
        console.error(err);
      }
    });
  }
}