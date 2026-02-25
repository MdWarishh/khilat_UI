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
  trending: string; // 'y' or 'n'
  createdAt: string;
  category: Category;
  productImages: ProductImage[];
  // Frontend computed property
  image?: string; // Will be set from productImages[0]
}



/** Shape of the reactive form used in add / edit. */
export interface ProductFormData {
  name:        string;
  description: string;
  price:       number;
  stock:       number;
  categoryId:  number;
  trending:    string;
  isActive:    boolean;
}
