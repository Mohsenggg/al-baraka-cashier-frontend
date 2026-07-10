import {
      Component,
      signal,
      OnInit,
      HostListener,
      inject,
      ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../../../../shared/components/sidebar/sidebar.component';
import { ProductStateService } from '../../services/product-state.service';
import {
      getStockClass,
      getStockLabel,
      getTypeLabel,
      getStatusLabel,
      getStatusClass,
      getVisibleDescAttributes,
      getDescAttrClass,
      hasMultipleBarcodes
} from '../../models/product.models';

@Component({
      selector: 'app-products-main-page',
      standalone: true,
      imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, RouterModule],
      templateUrl: './products-main-page.component.html',
      styleUrl: './products-main-page.component.css',
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsMainPageComponent implements OnInit {
      private state = inject(ProductStateService);
      private formBuilder = inject(FormBuilder);

      sidebarVisible = signal(false);

      isLoading = this.state.isLoading;
      showAdvancedFilters = this.state.showAdvancedFilters;
      searchQuery = this.state.searchQuery;
      selectedCategory = this.state.selectedCategory;
      selectedType = this.state.selectedType;
      selectedStockStatus = this.state.selectedStockStatus;
      currentPage = this.state.currentPage;
      pageSize = this.state.pageSize;
      totalPages = this.state.totalPages;
      totalProducts = this.state.totalProducts;
      products = this.state.products;

      filterForm!: FormGroup;
      hoveredProductId = signal<string>('');
      openMenuId = signal<string | null>(null);
      openBarcodePopoverId = signal<string | null>(null);
      popoverPosition = signal<'up' | 'down'>('down');

      Math = Math;

      readonly getStockClass = getStockClass;
      readonly getStockLabel = getStockLabel;
      readonly getTypeLabel = getTypeLabel;
      readonly getStatusLabel = getStatusLabel;
      readonly getStatusClass = getStatusClass;
      readonly getVisibleDescAttributes = getVisibleDescAttributes;
      readonly getDescAttrClass = getDescAttrClass;
      readonly hasMultipleBarcodes = hasMultipleBarcodes;

      constructor() {
            this.initializeFilterForm();
      }

      ngOnInit(): void {
            this.state.loadProducts();
      }

      onToggleSidebar(): void {
            this.sidebarVisible.update(v => !v);
      }

      private initializeFilterForm(): void {
            this.filterForm = this.formBuilder.group({
                  priceMin: [''],
                  priceMax: [''],
                  stockMin: [''],
                  stockMax: [''],
                  dateAdded: ['']
            });
      }

      onSearch(event: Event): void {
            const input = event.target as HTMLInputElement;
            this.state.setSearchQuery(input.value);
      }

      onFilterChange(): void {
            this.state.onFilterChange();
      }

      toggleAdvancedFilters(): void {
            this.state.toggleAdvancedFilters();
      }

      applyAdvancedFilters(): void {
            this.state.applyAdvancedFilters();
      }

      clearFilters(): void {
            this.filterForm.reset();
            this.state.clearFilters();
      }

      hasActiveFilters(): boolean {
            return this.state.hasActiveFilters(this.filterForm.value);
      }

      onRowHover(productId: string): void {
            this.hoveredProductId.set(productId);
      }

      onRowLeave(): void {
            this.hoveredProductId.set('');
      }

      toggleBarcodePopover(productId: string, event: Event): void {
            event.stopPropagation();
            this.openMenuId.set(null);

            const isOpening = this.openBarcodePopoverId() !== productId;
            this.openBarcodePopoverId.set(isOpening ? productId : null);

            if (isOpening) {
                  const button = event.currentTarget as HTMLElement;
                  if (button) {
                        const rect = button.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const spaceBelow = viewportHeight - rect.bottom;

                        if (spaceBelow < 320 && rect.top > spaceBelow) {
                              this.popoverPosition.set('up');
                        } else {
                              this.popoverPosition.set('down');
                        }
                  }
            }
      }

      toggleMenu(productId: string, event: Event): void {
            event.stopPropagation();
            this.openBarcodePopoverId.set(null);
            this.openMenuId.set(this.openMenuId() === productId ? null : productId);
      }

      @HostListener('document:click')
      handleDocumentClick(): void {
            this.openMenuId.set(null);
            this.openBarcodePopoverId.set(null);
      }

      onViewProduct(productId: string): void {
            console.log('View product:', productId);
      }

      onEditProduct(productId: string): void {
            console.log('Edit product:', productId);
      }

      onDeleteProduct(productId: string): void {
            console.log('Delete product:', productId);
            if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                  this.state.deleteProduct(productId).subscribe();
            }
      }

      getPageNumbers(): number[] {
            return this.state.getPageNumbers();
      }

      previousPage(): void {
            this.state.previousPage();
      }

      nextPage(): void {
            this.state.nextPage();
      }

      goToPage(page: number): void {
            this.state.goToPage(page);
      }
}
