// src/app/admin/products/admin-products.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
        
import { Product } from '../../models/product.model';
import * as bootstrap from 'bootstrap';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrls: ['./products.css']   // agar css file hai to add karo
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  
  currentProduct: Product = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true,
    trending: 'n',
    createdAt: new Date().toISOString(),
    category: { id: 0, name: '', description: '' },
    productImages: []
  };

  isEdit: boolean = false;
  loading: boolean = true;
  selectedFiles: File[] = [];  // Changed to array for multiple images
  deleteImageIds: boolean[] = [];  // Array for checkboxes (true if delete)

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data.map(p => ({
          ...p,
         image: p.productImages?.[0]?.imageUrl
  ? 'http://localhost:8080' + p.productImages[0].imageUrl
  : 'assets/images/placeholder.png'

        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  openAddModal(): void {
    this.isEdit = false;
    
    this.currentProduct = {
      id: 0,
      name: '',
      description: '',
      price: 0,
      stock: 0,
      isActive: true,
      trending: 'n',
      createdAt: new Date().toISOString(),
      category: { id: 0, name: '', description: '' },
      productImages: []
    };
    
    this.selectedFiles = [];
    this.deleteImageIds = [];
    this.showModal();
  }

  openEditModal(product: Product): void {
    this.isEdit = true;
    
    this.currentProduct = {
      ...product,
      category: {
        id: product.category?.id || 0,
        name: product.category?.name || '',
        description: product.category?.description || ''
      },
      productImages: product.productImages || [],
      createdAt: product.createdAt || new Date().toISOString(),
      trending: product.trending || 'n',
      isActive: product.isActive ?? true
    };
    
    this.selectedFiles = [];
    this.deleteImageIds = new Array(this.currentProduct.productImages.length).fill(false);  // Init checkboxes
    this.showModal();
  }

  saveProduct(): void {
  if (!this.currentProduct.name || this.currentProduct.price <= 0) {
    alert('Name and Price are required!');
    return;
  }

  // Clean object – sirf backend DTO ke fields bhej
  const productToSend = {
    name: this.currentProduct.name,
    description: this.currentProduct.description || '',
    price: this.currentProduct.price,
    stock: this.currentProduct.stock,
    isActive: this.currentProduct.isActive ?? true,
    trending: this.currentProduct.trending || 'n',
   categoryId: this.currentProduct.category.id
 // sirf id bhej, full object nahi
    // Add other required fields from ProductRequest (agar hai to)
  };

  console.log('Sending JSON:', JSON.stringify(productToSend));  // ← yeh console mein dekh

  const formData = new FormData();
  formData.append('product', JSON.stringify(productToSend));


  this.selectedFiles.forEach(file => {
    formData.append('images', file);  // name exactly 'images'
  });

  // Debug: FormData content check (browser devtools → Network tab → Request Payload)
  console.log('FormData ready, files count:', this.selectedFiles.length);

  const observable = this.isEdit
    ? this.productService.updateProduct(this.currentProduct.id, formData)
    : this.productService.createProduct(formData);

  observable.subscribe({
    next: (res) => {
      console.log('Success response:', res);
      this.loadProducts();
      this.hideModal();
      alert(this.isEdit ? 'Updated!' : 'Added!');
    },
    error: (err) => {
      console.error('Full error:', err);
      if (err.error && err.error.message) {
        alert('Backend error: ' + err.error.message);
      } else {
        alert('Server error 500 – check backend logs');
      }
    }
  });
}

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts();
        alert('Product deleted successfully!');
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Could not delete product. Check if endpoint exists in backend.');
      }
    });
  }

 onFilesChange(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files) {
    this.selectedFiles = Array.from(input.files);

    // generate preview ONCE
    this.filePreviews = this.selectedFiles.map(file =>
      URL.createObjectURL(file)
    );
  }
}


  filePreviews: string[] = [];


  showModal(): void {
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  hideModal(): void {
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}