import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, debounceTime, finalize, Subject, tap, throwError } from 'rxjs';
import { ProductApiService } from './product-api.service';
import type { ProductFilterParams, ProductListItem, ProductListItemDto } from '../models/product.models';
import { resolveStockStatus } from '../models/product.models';

@Injectable({
      providedIn: 'root'
})
export class ProductStateService {
      private api = inject(ProductApiService);

      private readonly apiReload$ = new Subject<void>();

      private _loading = new BehaviorSubject<boolean>(false);
      public loading$ = this._loading.asObservable();

      private _error = new BehaviorSubject<string | null>(null);
      public error$ = this._error.asObservable();

      private allProductsSignal = signal<ProductListItem[]>([]);
      public allProducts = this.allProductsSignal.asReadonly();

      private serverTotalElements = signal(0);
      private serverTotalPages = signal(0);

      public isLoading = signal<boolean>(false);

      public searchQuery = signal<string>('');
      public selectedCategory = signal<string>('');
      public selectedStatus = signal<string>('');

      public currentPage = signal<number>(1);
      public pageSize = signal<number>(20);

      constructor() {
            this.apiReload$.pipe(debounceTime(300)).subscribe(() => {
                  this.fetchProductsFromApi();
            });
      }

      public totalPages = computed(() => this.serverTotalPages());

      public totalProducts = computed(() => this.serverTotalElements());

      public products = computed(() => {
            return this.allProductsSignal();
      });

      public loadProducts(): void {
            this.fetchProductsFromApi();
      }

      public setSearchQuery(query: string): void {
            this.searchQuery.set(query);
            this.currentPage.set(1);
            this.queueApiReload();
      }

      public onFilterChange(): void {
            this.currentPage.set(1);
            this.queueApiReload();
      }

      public clearFilters(): void {
            this.searchQuery.set('');
            this.selectedCategory.set('');
            this.selectedStatus.set('');
            this.currentPage.set(1);
            this.queueApiReload();
      }

      public hasActiveFilters(): boolean {
            return !!(
                  this.searchQuery() ||
                  this.selectedCategory() ||
                  this.selectedStatus()
            );
      }

      public deleteProduct(productId: number): Observable<void> {
            return this.api.deleteProduct(productId).pipe(
                  tap(() => {
                        this.loadProducts();
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
                  this.queueApiReload(true);
            }
      }

      public nextPage(): void {
            if (this.currentPage() < this.totalPages()) {
                  this.currentPage.update(p => p + 1);
                  this.queueApiReload(true);
            }
      }

      public goToPage(page: number): void {
            if (page > 0 && page <= this.totalPages()) {
                  this.currentPage.set(page);
                  this.queueApiReload(true);
            }
      }

      public clearError(): void {
            this._error.next(null);
      }

      private fetchProductsFromApi(): void {
            this.setLoading(true);

            this.api.listProducts(this.buildFilterParams()).pipe(
                  tap(response => {
                        const items = (response.content ?? []).map(dto => this.mapDtoToListItem(dto));
                        this.allProductsSignal.set(items);
                        this.serverTotalElements.set(response.totalElements ?? 0);
                        this.serverTotalPages.set(response.totalPages ?? 0);
                        this.clearError();
                  }),
                  catchError(err => {
                        this.handleError(err);
                        return throwError(() => err);
                  }),
                  finalize(() => this.setLoading(false))
            ).subscribe();
      }

      private buildFilterParams(): ProductFilterParams {
            return {
                  query: this.searchQuery() || undefined,
                  categoryId: this.selectedCategory() ? Number(this.selectedCategory()) : undefined,
                  status: this.selectedStatus() || undefined,
                  page: this.currentPage() - 1,
                  size: this.pageSize(),
                  sort: 'createdAt,DESC'
            };
      }

      private queueApiReload(immediate = false): void {
            if (immediate) {
                  this.fetchProductsFromApi();
                  return;
            }

            this.apiReload$.next();
      }

      private mapDtoToListItem(dto: ProductListItemDto): ProductListItem {
            return { ...dto };
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
