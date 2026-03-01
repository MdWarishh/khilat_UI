// admin/products/product-filters/product-filters.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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

  // Parent se categories aayegi
  @Input() categories: Category[] = [];

  // Parent se current filters milenge (two-way binding ke liye)
  @Input()  filters: ProductFilters = {
    searchQuery: '', filterCategory: '', filterTrending: '', filterStatus: ''
  };

  // Jab koi filter change ho to parent ko batao
  @Output() filtersChange  = new EventEmitter<ProductFilters>();
  @Output() onSearch       = new EventEmitter<void>();
  @Output() onClearSearch  = new EventEmitter<void>();
  @Output() onClearAll     = new EventEmitter<void>();
  @Output() onAddProduct   = new EventEmitter<void>();

  handleSearch(): void {
    this.filtersChange.emit({ ...this.filters });
    this.onSearch.emit();
  }

  handleFilterChange(): void {
    this.filtersChange.emit({ ...this.filters });
  }

  handleClearSearch(): void {
    this.filters.searchQuery = '';
    this.filtersChange.emit({ ...this.filters });
    this.onClearSearch.emit();
  }

  handleClearAll(): void {
    this.filters = { searchQuery: '', filterCategory: '', filterTrending: '', filterStatus: '' };
    this.filtersChange.emit({ ...this.filters });
    this.onClearAll.emit();
  }
}