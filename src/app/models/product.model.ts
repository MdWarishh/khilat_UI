// src/app/models/product.model.ts

export interface ProductImage {
  id: number;
  imageUrl: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface ProductVariant {
  id?: number;
  size: string;
  price: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  trending: string;   // 'YES' or 'NO'
  createdAt: string;
  category: Category;
  productImages: ProductImage[];
  variants: ProductVariant[];

  // Frontend computed — resolveImage() se set hota hai
  image?: string[];
}

// Pagination response
export interface ProductPage {
  content:       Product[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
  last:          boolean;
}

export interface ProductFilters {
  searchQuery:    string;
  filterCategory: string;
  filterTrending: string;
  filterStatus:   string;
}

export interface ProductFormData {
  name:        string;
  description: string;
  categoryId:  number;
  trending:    string;
  isActive:    boolean;
  variants:    ProductVariant[];
}