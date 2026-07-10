import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { ProductApiService } from './product-api.service';
import { ProductSeedService } from './product-seed.service';
import type { ProductListItem, ProductListItemDto } from '../models/product.models';
import { resolveStockStatus } from '../models/product.models';

@Injectable({
      providedIn: 'root'
})
export class ProductStateService {
      private api = inject(ProductApiService);
      private seed = inject(ProductSeedService);

      private readonly useSeedData = true;

      private _loading = new BehaviorSubject<boolean>(false);
      public loading$ = this._loading.asObservable();

      private _error = new BehaviorSubject<string | null>(null);
      public error$ = this._error.asObservable();

      private allProductsSignal = signal<ProductListItem[]>([]);
      public allProducts = this.allProductsSignal.asReadonly();

      public isLoading = signal<boolean>(false);
      public showAdvancedFilters = signal<boolean>(false);

      public searchQuery = signal<string>('');
      public selectedCategory = signal<string>('');
      public selectedType = signal<string>('');
      public selectedStockStatus = signal<string>('');

      public currentPage = signal<number>(1);
      public pageSize = signal<number>(20);

      public filteredProducts = computed(() => {
            let products = this.allProductsSignal();
            const query = this.searchQuery().toLowerCase();

            if (query) {
                  products = products.filter(p =>
                        p.name.toLowerCase().includes(query) ||
                        p.descAttributes?.some(attr => attr.value.toLowerCase().includes(query)) ||
                        p.code.toLowerCase().includes(query) ||
                        p.barcodes.some(b => b.barcode.toLowerCase().includes(query))
                  );
            }

            const category = this.selectedCategory();
            if (category) {
                  products = products.filter(p => p.category === category);
            }

            const type = this.selectedType();
            if (type) {
                  products = products.filter(p => p.type === type);
            }

            const stockStatus = this.selectedStockStatus();
            if (stockStatus) {
                  products = products.filter(p => {
                        const status = resolveStockStatus(p.summary.totalStock, p.minStockLevel, p.maxStockLevel);
                        return status === stockStatus;
                  });
            }

            return products;
      });

      public totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()));
      public totalProducts = computed(() => this.filteredProducts().length);

      public products = computed(() => {
            const start = (this.currentPage() - 1) * this.pageSize();
            const end = start + this.pageSize();
            return this.filteredProducts().slice(start, end);
      });

      public loadProducts(): void {
            this.setLoading(true);

            const source$ = this.useSeedData
                  ? this.seed.getProducts()
                  : this.api.getAllProducts().pipe(map(dtos => dtos.map(dto => this.mapDtoToListItem(dto))));

            source$.pipe(
                  tap(products => {
                        this.allProductsSignal.set(products);
                        this.clearError();
                  }),
                  catchError(err => {
                        this.handleError(err);
                        return throwError(() => err);
                  }),
                  finalize(() => this.setLoading(false))
            ).subscribe();
      }

      public setSearchQuery(query: string): void {
            this.searchQuery.set(query);
            this.currentPage.set(1);
      }

      public onFilterChange(): void {
            this.currentPage.set(1);
      }

      public toggleAdvancedFilters(): void {
            this.showAdvancedFilters.update(value => !value);
      }

      public applyAdvancedFilters(): void {
            this.currentPage.set(1);
            this.showAdvancedFilters.set(false);
      }

      public clearFilters(): void {
            this.searchQuery.set('');
            this.selectedCategory.set('');
            this.selectedType.set('');
            this.selectedStockStatus.set('');
            this.currentPage.set(1);
            this.showAdvancedFilters.set(false);
      }

      public hasActiveFilters(advancedFilterValues: Record<string, unknown> = {}): boolean {
            return !!(
                  this.searchQuery() ||
                  this.selectedCategory() ||
                  this.selectedType() ||
                  this.selectedStockStatus() ||
                  Object.values(advancedFilterValues).some(v => v)
            );
      }

      public deleteProduct(productId: string): Observable<void> {
            const product = this.allProductsSignal().find(p => p.id === productId);

            if (this.useSeedData) {
                  this.allProductsSignal.update(products => products.filter(p => p.id !== productId));
                  return new Observable<void>(observer => {
                        observer.next();
                        observer.complete();
                  });
            }

            if (!product) {
                  return throwError(() => new Error('Product not found'));
            }

            return this.api.deleteProduct(product.code).pipe(
                  tap(() => {
                        this.allProductsSignal.update(products => products.filter(p => p.id !== productId));
                  }),
                  catchError(err => {
                        this.handleError(err);
                        return throwError(() => err);
                  })
            );
      }

      public getPageNumbers(): number[] {
            const total = this.totalPages();
            const current = this.currentPage();
            const maxDisplay = 5;

            if (total <= maxDisplay) {
                  return Array.from({ length: total }, (_, i) => i + 1);
            }

            const pages: number[] = [];
            const start = Math.max(1, current - 2);
            const end = Math.min(total, current + 2);

            if (start > 1) pages.push(1);
            if (start > 2) pages.push(-1);

            for (let i = start; i <= end; i++) {
                  pages.push(i);
            }

            if (end < total - 1) pages.push(-1);
            if (end < total) pages.push(total);

            return pages;
      }

      public previousPage(): void {
            if (this.currentPage() > 1) {
                  this.currentPage.update(p => p - 1);
            }
      }

      public nextPage(): void {
            if (this.currentPage() < this.totalPages()) {
                  this.currentPage.update(p => p + 1);
            }
      }

      public goToPage(page: number): void {
            if (page > 0 && page <= this.totalPages()) {
                  this.currentPage.set(page);
            }
      }

      public clearError(): void {
            this._error.next(null);
      }

      private mapDtoToListItem(dto: ProductListItemDto): ProductListItem {
            const barcodes = dto.barcodes ?? [];
            const summary = dto.summary ?? {
                  defaultBarcodeId: barcodes.find(b => b.default)?.id ?? 0,
                  maxSellingPrice: barcodes.reduce((max, b) => Math.max(max, b.sellingPrice), 0),
                  totalStock: barcodes.reduce((sum, b) => sum + b.stock, 0),
                  barcodeCount: barcodes.length
            };

            return {
                  id: dto.id,
                  name: dto.name,
                  code: dto.code,
                  type: dto.type,
                  status: dto.status,
                  category: dto.category,
                  minStockLevel: dto.minStockLevel,
                  maxStockLevel: dto.maxStockLevel,
                  createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
                  descAttributes: dto.descAttributes,
                  barcodes,
                  summary
            };
      }

      private setLoading(loading: boolean): void {
            this._loading.next(loading);
            this.isLoading.set(loading);
      }

      private handleError(err: unknown): void {
            const message = (err as { error?: { message?: string }; message?: string })?.error?.message
                  || (err as { message?: string })?.message
                  || 'حدث خطأ غير متوقع';
            this._error.next(message);
      }
}
