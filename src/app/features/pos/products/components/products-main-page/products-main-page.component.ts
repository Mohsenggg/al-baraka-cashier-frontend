import {
      Component,
      signal,
      OnInit,
      HostListener,
      inject,
      ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../../../../shared/components/sidebar/sidebar.component';
import { ProductStateService } from '../../services/product-state.service';
import {
      getStockClass,
      getStockLabel,
      getTypeLabel,
      getStatusLabel,
      getStatusClass
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
      private router = inject(Router);

      sidebarVisible = signal(false);

      isLoading = this.state.isLoading;
      searchQuery = this.state.searchQuery;
      selectedCategory = this.state.selectedCategory;
      selectedManufacturer = this.state.selectedManufacturer;
      selectedSupplier = this.state.selectedSupplier;
      selectedStatus = this.state.selectedStatus;
      categories = this.state.categories;
      manufacturers = this.state.manufacturers;
      suppliers = this.state.suppliers;
      currentPage = this.state.currentPage;
      pageSize = this.state.pageSize;
      totalPages = this.state.totalPages;
      totalProducts = this.state.totalProducts;
      products = this.state.products;

      hoveredProductId = signal<number | null>(null);
      openMenuId = signal<number | null>(null);

      Math = Math;

      readonly getStockClass = getStockClass;
      readonly getStockLabel = getStockLabel;
      readonly getTypeLabel = getTypeLabel;
      readonly getStatusLabel = getStatusLabel;
      readonly getStatusClass = getStatusClass;

      ngOnInit(): void {
            this.state.loadProducts();
      }

      onToggleSidebar(): void {
            this.sidebarVisible.update(v => !v);
      }

      onSearch(event: Event): void {
            const input = event.target as HTMLInputElement;
            this.state.setSearchQuery(input.value);
      }

      onFilterChange(): void {
            this.state.onFilterChange();
      }

      onCategoryChange(value: string): void {
            this.state.setSelectedCategory(value);
      }

      onManufacturerChange(value: string): void {
            this.state.setSelectedManufacturer(value);
      }

      onSupplierChange(value: string): void {
            this.state.setSelectedSupplier(value);
      }

      clearFilters(): void {
            this.state.clearFilters();
      }

      hasActiveFilters(): boolean {
            return this.state.hasActiveFilters();
      }

      onRowHover(productId: number): void {
            this.hoveredProductId.set(productId);
      }

      onRowLeave(): void {
            this.hoveredProductId.set(null);
      }

      toggleMenu(productId: number, event: Event): void {
            event.stopPropagation();
            this.openMenuId.set(this.openMenuId() === productId ? null : productId);
      }

      @HostListener('document:click')
      handleDocumentClick(): void {
            this.openMenuId.set(null);
      }

      onViewProduct(productId: number): void {
            this.router.navigate(['/pos/product/manage', productId]);
      }

      onEditProduct(productId: number): void {
            this.router.navigate(['/pos/product/manage', productId]);
      }

      onDeleteProduct(productId: number): void {
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
