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

  @Input()  product:  Product | null = null;
  @Input()  show:     boolean        = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit  = new EventEmitter<Product>();

  activeImageIndex = 0;

  ngOnChanges(): void {
    if (this.show) {
      this.activeImageIndex = 0;
      // ✅ FIX: page scroll band karo jab modal khule
      document.body.style.overflow = 'hidden';
    } else {
      // ✅ FIX: modal band ho to page scroll wapas chalu
      document.body.style.overflow = '';
    }
  }

  // ✅ FIX: component destroy hone par bhi scroll restore karo
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  resolveImage(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `${environment.imageBaseUrl}${imageUrl}`;
  }
}