// admin/products/product-detail-modal/product-detail-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product }      from '../../../models/product.model';
import { environment }  from '../../../../environments/environments';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-modal.component.html',
  styleUrl:    './product-detail-modal.component.css'
})
export class ProductDetailModalComponent implements OnChanges, OnDestroy {

  @Input()  product: Product | null = null;
  @Input()  show:    boolean        = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit  = new EventEmitter<Product>();

  activeImageIndex = 0;

  ngOnChanges(): void {
    if (this.show) {
      this.activeImageIndex = 0;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  getPriceDisplay(): string {
    const variants = this.product?.variants;
    if (!variants?.length) return '—';
    const prices = variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
  }

  getTotalStock(): number {
    return this.product?.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
  }

  resolveImage(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `${environment.imageBaseUrl}${imageUrl}`;
  }
}