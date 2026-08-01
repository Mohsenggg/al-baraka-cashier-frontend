import {
  Component, Input, Output, EventEmitter, ElementRef, ViewChild,
  HostListener, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductSearchService, ProductSearchFilters, StockFilter, SharedProduct } from '../../services/product-search.service';

@Component({
  selector: 'app-product-search-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-search-popup.component.html',
  styleUrl: './product-search-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSearchPopupComponent<T extends SharedProduct> implements OnChanges {
  private searchService = inject(ProductSearchService);
  private cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  private _products: T[] = [];
  @Input()
  set products(value: T[]) {
    this._products = value ?? [];
    if (this.isOpen) {
      this.applyFilter();
    }
  }
  get products(): T[] {
    return this._products;
  }

  @Input() trigger?: HTMLElement;
  @Input() initialQuery = '';
  @Input() title = 'بحث عن منتج';
  @Input() showAdvancedFilters = true;

  @Output() productSelected = new EventEmitter<T>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('popupPanel') popupPanel?: ElementRef<HTMLElement>;
  @ViewChild('popupSearchInput') popupSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('resultsBody') resultsBody?: ElementRef<HTMLElement>;

  query = '';
  advancedOpen = false;
  advName = '';
  advCode = '';
  advPriceMin: number | null = null;
  advPriceMax: number | null = null;
  advStockStatus: StockFilter = 'all';

  filteredProducts: T[] = [];
  highlightedIndex = 0;
  overlayStyle: Record<string, string> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialQuery'] && this.isOpen) {
      this.query = this.initialQuery;
      this.applyFilter();
    }
    if (changes['isOpen'] && this.isOpen) {
      this.query = this.initialQuery;
      this.highlightedIndex = 0;
      this.applyFilter();
      setTimeout(() => {
        this.positionOverlay();
        this.popupSearchInput?.nativeElement?.focus();
        this.popupSearchInput?.nativeElement?.select();
      }, 0);
    }
    if (changes['products'] && this.isOpen) {
      this.applyFilter();
    }
  }

  onQueryChange(): void {
    this.applyFilter();
  }

  clearQuery(): void {
    this.query = '';
    this.applyFilter();
    this.popupSearchInput?.nativeElement?.focus();
  }

  clearAdvancedFilters(): void {
    this.advName = '';
    this.advCode = '';
    this.advPriceMin = null;
    this.advPriceMax = null;
    this.advStockStatus = 'all';
    this.applyFilter();
  }

  toggleAdvanced(): void {
    this.advancedOpen = !this.advancedOpen;
    setTimeout(() => this.positionOverlay(), 0);
  }

  applyFilter(): void {
    const filters: ProductSearchFilters = {
      query: this.query,
      name: this.advName,
      code: this.advCode,
      priceMin: this.advPriceMin,
      priceMax: this.advPriceMax,
      stockStatus: this.advStockStatus
    };
    this.filteredProducts = this.searchService.filterProducts(this.products, filters);
    this.highlightedIndex = this.filteredProducts.length > 0 ? 0 : -1;
    this.cdr.markForCheck();
  }

  selectProduct(product: T): void {
    this.productSelected.emit(product);
    this.close();
  }

  close(): void {
    this.closed.emit();
  }

  onRowDoubleClick(product: T, event: MouseEvent): void {
    event.preventDefault();
    this.selectProduct(product);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlight(-1);
        break;
      case 'Enter':
        if (this.highlightedIndex >= 0 && this.filteredProducts[this.highlightedIndex]) {
          event.preventDefault();
          event.stopPropagation();
          this.selectProduct(this.filteredProducts[this.highlightedIndex]);
        }
        break;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) this.positionOverlay();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen) this.positionOverlay();
  }

  isHighlighted(index: number): boolean {
    return index === this.highlightedIndex;
  }

  trackByProductId(_index: number, product: T): number {
    return product.id;
  }

  private moveHighlight(delta: number): void {
    if (this.filteredProducts.length === 0) return;
    this.highlightedIndex = (this.highlightedIndex + delta + this.filteredProducts.length) % this.filteredProducts.length;
    this.cdr.markForCheck();
    this.scrollHighlightedIntoView();
  }

  private scrollHighlightedIntoView(): void {
    setTimeout(() => {
      const row = this.resultsBody?.nativeElement?.querySelector('.psp-row.highlighted') as HTMLElement | null;
      row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  private positionOverlay(): void {
    const panelEl = this.popupPanel?.nativeElement;
    const pad = 12;
    const width = Math.min(600, window.innerWidth - pad * 2);
    const panelHeight = panelEl?.offsetHeight || 400;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Calculate center positions
    const top = Math.max(pad, (vh - panelHeight) / 2);
    const left = Math.max(pad, (vw - width) / 2);

    this.overlayStyle = {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${Math.min(480, vh - pad * 2)}px`
    };

    this.cdr.detectChanges();
  }
}
