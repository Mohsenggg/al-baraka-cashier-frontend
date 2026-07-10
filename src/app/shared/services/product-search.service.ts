import { Injectable } from '@angular/core';
import type { Product } from '../../features/pos/core/models/pos.models';

export type StockFilter = 'all' | 'in_stock' | 'out_of_stock';

export interface ProductSearchFilters {
  query: string;
  name?: string;
  code?: string;
  priceMin?: number | null;
  priceMax?: number | null;
  stockStatus?: StockFilter;
}

@Injectable({ providedIn: 'root' })
export class ProductSearchService {

  findExactByCode(products: Product[], code: string): Product | undefined {
    const term = code.trim().toLowerCase();
    if (!term) return undefined;
    return products.find(p => p.barcode.toLowerCase() === term);
  }

  filterProducts(products: Product[], filters: ProductSearchFilters): Product[] {
    let result = products.filter(p => p.isActive !== false);

    const query = filters.query.trim().toLowerCase();
    if (query) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.barcode.toLowerCase().includes(query)
      );
    }

    const name = filters.name?.trim().toLowerCase();
    if (name) {
      result = result.filter(p => p.name.toLowerCase().includes(name));
    }

    const code = filters.code?.trim().toLowerCase();
    if (code) {
      result = result.filter(p => p.barcode.toLowerCase().includes(code));
    }

    if (filters.priceMin != null && !isNaN(filters.priceMin)) {
      result = result.filter(p => p.sellingPrice >= filters.priceMin!);
    }

    if (filters.priceMax != null && !isNaN(filters.priceMax)) {
      result = result.filter(p => p.sellingPrice <= filters.priceMax!);
    }

    if (filters.stockStatus === 'in_stock') {
      result = result.filter(p => p.stockQuantity > 0);
    } else if (filters.stockStatus === 'out_of_stock') {
      result = result.filter(p => p.stockQuantity <= 0);
    }

    return result;
  }

  hasPartialMatches(products: Product[], query: string): boolean {
    const term = query.trim();
    if (!term) return false;
    if (this.findExactByCode(products, term)) return false;
    return this.filterProducts(products, { query: term }).length > 0;
  }
}
