// admin/products/product-table/product-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Product }      from '../../../models/product.model';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-table.component.html',
  styleUrl:    './product-table.component.css'
})
export class ProductTableComponent {

  @Input() products:      Product[] = [];
  @Input() totalElements: number    = 0;
  @Input() startIndex:    number    = 0;
  @Input() endIndex:      number    = 0;
  @Input() currentPage:   number    = 1;
  @Input() totalPages:    number    = 1;
  @Input() pageSize:      number    = 10;
  @Input() pageNumbers:   number[]  = [];
  @Input() sortField: 'name' | 'price' | 'stock' = 'name';
  @Input() sortDir:   'asc'  | 'desc'             = 'asc';

  @Output() onView           = new EventEmitter<Product>();
  @Output() onEdit           = new EventEmitter<Product>();
  @Output() onDelete         = new EventEmitter<number>();
  @Output() onSort           = new EventEmitter<'name' | 'price' | 'stock'>();
  @Output() onPageChange     = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onClearFilters   = new EventEmitter<void>();

  // Row expand karne ke liye
  expandedProductId: number | null = null;

  toggleExpand(id: number): void {
    this.expandedProductId = this.expandedProductId === id ? null : id;
  }

  // Variants se min price
  getMinPrice(p: Product): number {
    if (!p.variants?.length) return 0;
    return Math.min(...p.variants.map(v => v.price));
  }

  // Variants se max price
  getMaxPrice(p: Product): number {
    if (!p.variants?.length) return 0;
    return Math.max(...p.variants.map(v => v.price));
  }

  // Price range string
  getPriceDisplay(p: Product): string {
    if (!p.variants?.length) return '—';
    const min = this.getMinPrice(p);
    const max = this.getMaxPrice(p);
    return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
  }

  // Total stock across all variants
  getTotalStock(p: Product): number {
    if (!p.variants?.length) return 0;
    return p.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  // Stock chip class
  getStockClass(p: Product): string {
    const total = this.getTotalStock(p);
    if (total === 0) return 'out';
    if (total <= 10) return 'low';
    return '';
  }

  getStockLabel(p: Product): string {
    const total = this.getTotalStock(p);
    if (total === 0) return 'Out of Stock';
    return String(total);
  }

  // First image
  getImage(p: Product): string {
    return p.productImages?.[0]?.imageUrl ?? '';
  }
}