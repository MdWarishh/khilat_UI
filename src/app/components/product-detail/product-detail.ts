// product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterLink }        from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService }    from '../../services/product.service';
import { Product }           from '../../models/product.model';
import { environment }       from '../../../environments/environments';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {

  product:      Product | null = null;
  loading       = true;
  error         = false;
  pageVisible   = false;

  images:           string[] = [];
  activeImage:      string   = '';
  activeImageIndex: number   = 0;
  isZoomed        = false;

  sizes:  string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  colors: { name: string; hex: string }[] = [
    { name: 'Blush Pink', hex: '#FFD1D1' },
    { name: 'Ivory',      hex: '#FFF5E4' },
    { name: 'Deep Rose',  hex: '#FF9494' },
    { name: 'Charcoal',   hex: '#3d3d3d' },
    { name: 'Sage Green', hex: '#b2c9ad' },
  ];
  selectedSize  = '';
  selectedColor = '';
  qty           = 1;

  addedToCart     = false;
  relatedProducts: any[] = [];
  isNew           = false;

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.resetState();
        this.loadProduct(Number(id));  // ← FIX: string → number
      }
    });
  }

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────

  private resetState(): void {
    this.product          = null;
    this.loading          = true;
    this.error            = false;
    this.pageVisible      = false;
    this.activeImageIndex = 0;
    this.qty              = 1;
    this.selectedSize     = '';
    this.selectedColor    = '';
    this.addedToCart      = false;
    this.relatedProducts  = [];
    this.images           = [];
    this.activeImage      = '';
  }

  private loadProduct(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product: any) => {
        this.product = product;
        this.setupImages(product);
        this.checkIfNew(product);
        this.loading = false;
        setTimeout(() => (this.pageVisible = true), 80);

        if (product.category?.id) {
          this.loadRelated(product.category.id, product.id);
        }
      },
      error: (err: any) => {
        console.error('Product load error:', err);
        this.loading = false;
        this.error   = true;
      }
    });
  }

  private loadRelated(categoryId: number, currentProductId: number): void {
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: (products: Product[]) => {
        this.relatedProducts = products
          .filter(p => p.id !== currentProductId)
          .slice(0, 4)
          .map(p => ({ ...p, image: this.resolveImage(p) }));
      },
      error: () => {}
    });
  }

  // ─────────────────────────────────────────────
  // IMAGE HELPERS
  // ─────────────────────────────────────────────

  private setupImages(product: any): void {
    if (product.productImages && product.productImages.length > 0) {
      this.images = product.productImages.map((img: any) => this.resolveUrl(img.imageUrl));
    } else {
      this.images = [];
    }
    this.activeImage = this.images[0] || '';
  }

  private resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.imageBaseUrl}${url}`;
  }

  private resolveImage(product: any): string {
    if (!product.productImages || product.productImages.length === 0) return '';
    return this.resolveUrl(product.productImages[0].imageUrl);
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
    this.activeImage      = this.images[index];
  }

  nextImage(): void {
    const next = (this.activeImageIndex + 1) % this.images.length;
    this.setActiveImage(next);
  }

  prevImage(): void {
    const prev = (this.activeImageIndex - 1 + this.images.length) % this.images.length;
    this.setActiveImage(prev);
  }

  // ─────────────────────────────────────────────
  // SELECTORS
  // ─────────────────────────────────────────────

  selectSize(size: string): void   { this.selectedSize  = size;  }
  selectColor(color: string): void { this.selectedColor = color; }

  incrementQty(): void {
    if (this.product && this.qty < (this.product as any).stock) this.qty++;
  }
  decrementQty(): void {
    if (this.qty > 1) this.qty--;
  }

  // ─────────────────────────────────────────────
  // CART (placeholder — CartService baad mein add karna)
  // ─────────────────────────────────────────────

  addToCart(): void {
    if (!this.product) return;
    console.log('Add to cart:', {
      productId: (this.product as any).id,
      name:      (this.product as any).name,
      price:     (this.product as any).price,
      qty:       this.qty,
      size:      this.selectedSize,
      color:     this.selectedColor,
    });
    this.addedToCart = true;
    setTimeout(() => (this.addedToCart = false), 2500);
  }

  // ─────────────────────────────────────────────
  // ROUTING
  // ─────────────────────────────────────────────

  goToProduct(id: number | string): void {
    this.router.navigate(['/products', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────────

  getDiscount(): number {
    const p = this.product as any;
    if (!p?.originalPrice || !p?.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }

  private checkIfNew(product: any): void {
    if (!product.createdAt) return;
    const created  = new Date(product.createdAt);
    const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    this.isNew = diffDays <= 30;
  }
}