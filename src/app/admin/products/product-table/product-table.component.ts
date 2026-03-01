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

  // Data
  @Input() products:      Product[] = [];
  @Input() totalElements: number    = 0;
  @Input() startIndex:    number    = 0;
  @Input() endIndex:      number    = 0;

  // Pagination
  @Input() currentPage:  number   = 1;
  @Input() totalPages:   number   = 1;
  @Input() pageSize:     number   = 10;
  @Input() pageNumbers:  number[] = [];

  // Sort state (parent manage karega, table sirf dikhayega)
  @Input() sortField: 'name' | 'price' | 'stock' = 'name';
  @Input() sortDir:   'asc'  | 'desc'             = 'asc';

  // Events — parent ko batana hai kya karna hai
  @Output() onView        = new EventEmitter<Product>();
  @Output() onEdit        = new EventEmitter<Product>();
  @Output() onDelete      = new EventEmitter<number>();
  @Output() onSort        = new EventEmitter<'name' | 'price' | 'stock'>();
  @Output() onPageChange  = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onClearFilters   = new EventEmitter<void>();
}