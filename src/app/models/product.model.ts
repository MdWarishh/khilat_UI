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

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  isActive: boolean;
  trending: string;   // 'y' or 'n'
  createdAt: string;
  category: Category;
  productImages: ProductImage[];

  // Frontend computed — resolveImage() se set hota hai
  image?: string[];
}

// Pagination response ke liye alag interface — Product se alag rakho
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
  price:       number;
  stock:       number;
  categoryId:  number;
  trending:    string;
  isActive:    boolean;
}