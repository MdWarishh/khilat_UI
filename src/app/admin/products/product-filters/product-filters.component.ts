// admin/products/product-filters/product-filters.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Category, ProductFilters } from '../../../models/product.model';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.component.html',
  styleUrl:    './product-filters.component.css'
})
export class ProductFiltersComponent {

  @Input() categories: Category[]    = [];
  @Input() filters:    ProductFilters = { searchQuery: '', filterCategory: '', filterTrending: '', filterStatus: '' };

  // Sirf ek output — parent khud decide karega kya karna hai
  @Output() filtersChange = new EventEmitter<ProductFilters>();
  @Output() onAddProduct  = new EventEmitter<void>();

  // Search box me type hone par (ngModelChange se bind karo HTML me)
  onSearchInput(): void {
    this.filtersChange.emit({ ...this.filters });
  }

  // Dropdown change hone par
  onDropdownChange(): void {
    this.filtersChange.emit({ ...this.filters });
  }

  // Clear search button
  clearSearch(): void {
    this.filters = { ...this.filters, searchQuery: '' };
    this.filtersChange.emit({ ...this.filters });
  }

  // Clear all filters
  clearAll(): void {
    this.filters = { searchQuery: '', filterCategory: '', filterTrending: '', filterStatus: '' };
    this.filtersChange.emit({ ...this.filters });
  }
}