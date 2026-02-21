// src/app/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class ProductService {

  constructor(private http: HttpClient) {}

  // Trending products
  getTrendingProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/product/trending`);
  }

  // Latest / New Arrivals
  getRecentProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/product/latest`);
  }

  // All products (products list page ke liye)
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/product/latest`);
  }

  // ✅ FIXED: Correct backend endpoint
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/product/getProductById/${id}`);
  }

  // Related products — same category ke products
  // Backend mein ye API baad mein banegi, tab uncomment karna
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/product/by-category/${categoryId}`);
    // Jab tak backend ready nahi: return of([]);
  }

  // Create product
  createProduct(formData: FormData): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/admin/addproducts`, formData);
  }

  // Update product
  updateProduct(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/admin/updateproduct/${id}`, formData);
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/product/${id}`);
  }
}