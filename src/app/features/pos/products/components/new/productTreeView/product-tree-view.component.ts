import {
      Component,
      signal,
      computed,
      inject,
      OnInit,
      HostListener,
      ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../../../../../shared/components/sidebar/sidebar.component';
import {
      getStockClass,
      getStockLabel,
      getTypeLabel,
      getStatusLabel,
      getStatusClass,
      StockStatus,
      ProductStatus,
      ProductType
} from '../../../models/product.models';
import {
      CategoryNode,
      BrandNode,
      ProductGroupNode,
      TreeProductItem,
      TreeStatistics,
      computeTreeStats,
      INITIAL_MOCK_TREE_DATA
} from './models/product-tree.models';
import { ProductApiService } from '../../../services/product-api.service';

@Component({
      selector: 'app-product-tree-view',
      standalone: true,
      imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SidebarComponent],
      templateUrl: './product-tree-view.component.html',
      styleUrl: './product-tree-view.component.css',
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTreeViewComponent implements OnInit {
      private router = inject(Router);
      private productApiService = inject(ProductApiService);

      // Sidebar state
      sidebarVisible = signal(false);

      // Tree raw state
      treeData = signal<CategoryNode[]>([]);
      isLoading = signal(false);
      errorMessage = signal<string | null>(null);

      // Search & Filters
      searchQuery = signal<string>('');
      selectedCategoryId = signal<string>('');
      selectedStockFilter = signal<string>('');

      // UI popups / active menus
      openMenuProductId = signal<number | string | null>(null);
      activePricePopoverProductId = signal<number | string | null>(null);

      // Formatters imported from product.models
      readonly getStockClass = getStockClass;
      readonly getStockLabel = getStockLabel;
      readonly getTypeLabel = getTypeLabel;
      readonly getStatusLabel = getStatusLabel;
      readonly getStatusClass = getStatusClass;

      ngOnInit(): void {
            this.loadTreeData();
      }

      loadTreeData(): void {
            this.isLoading.set(true);
            this.errorMessage.set(null);
            this.productApiService.getProductTree().subscribe({
                  next: (res: any) => {
                        this.treeData.set(res.tree || []);
                        this.isLoading.set(false);
                  },
                  error: (err: any) => {
                        console.error('Failed to load product tree data', err);
                        this.errorMessage.set('فشل تحميل شجرة المنتجات. يرجى المحاولة مرة أخرى.');
                        this.isLoading.set(false);
                  }
            });
      }

      // Sidebar toggle
      onToggleSidebar(): void {
            this.sidebarVisible.update(v => !v);
      }

      // Filtered tree computation
      filteredTree = computed(() => {
            const query = this.searchQuery().trim().toLowerCase();
            const categoryFilter = this.selectedCategoryId();
            const stockFilter = this.selectedStockFilter();
            const rawTree = this.treeData();

            if (!query && !categoryFilter && !stockFilter) {
                  return rawTree;
            }

            const result: CategoryNode[] = [];

            for (const cat of rawTree) {
                  // Category filter check
                  if (categoryFilter && String(cat.id) !== categoryFilter) {
                        continue;
                  }

                  const catMatches = !query || cat.name.toLowerCase().includes(query) || cat.code.toLowerCase().includes(query);

                  // Filter brands
                  const filteredBrands: BrandNode[] = [];
                  for (const brand of cat.brands || []) {
                        const brandMatches = !query || brand.name.toLowerCase().includes(query) || brand.code.toLowerCase().includes(query);

                        const filteredBrandGroups: ProductGroupNode[] = [];
                        for (const group of brand.groups || []) {
                              const groupMatches = !query || group.name.toLowerCase().includes(query) || group.code.toLowerCase().includes(query);

                              const matchingProducts = (group.products || []).filter(product => {
                                    const prodMatches = !query ||
                                          product.name.toLowerCase().includes(query) ||
                                          product.sku.toLowerCase().includes(query) ||
                                          (product.vendorCode && product.vendorCode.toLowerCase().includes(query));

                                    const stockMatches = this.checkStockFilter(product.stock, stockFilter);
                                    return (catMatches || brandMatches || groupMatches || prodMatches) && stockMatches;
                              });

                              if (catMatches || brandMatches || groupMatches || matchingProducts.length > 0) {
                                    filteredBrandGroups.push({
                                          ...group,
                                          products: matchingProducts,
                                          expanded: query ? true : group.expanded
                                    });
                              }
                        }

                        if (catMatches || brandMatches || filteredBrandGroups.length > 0) {
                              filteredBrands.push({
                                    ...brand,
                                    groups: filteredBrandGroups,
                                    expanded: query ? true : brand.expanded
                              });
                        }
                  }

                  // Filter direct groups (without brands)
                  const filteredDirectGroups: ProductGroupNode[] = [];
                  for (const group of cat.directGroups || []) {
                        const groupMatches = !query || group.name.toLowerCase().includes(query) || group.code.toLowerCase().includes(query);

                        const matchingProducts = (group.products || []).filter(product => {
                              const prodMatches = !query ||
                                    product.name.toLowerCase().includes(query) ||
                                    product.sku.toLowerCase().includes(query) ||
                                    (product.vendorCode && product.vendorCode.toLowerCase().includes(query));

                              const stockMatches = this.checkStockFilter(product.stock, stockFilter);
                              return (catMatches || groupMatches || prodMatches) && stockMatches;
                        });

                        if (catMatches || groupMatches || matchingProducts.length > 0) {
                              filteredDirectGroups.push({
                                    ...group,
                                    products: matchingProducts,
                                    expanded: query ? true : group.expanded
                              });
                        }
                  }

                  if (catMatches || filteredBrands.length > 0 || filteredDirectGroups.length > 0) {
                        result.push({
                              ...cat,
                              brands: filteredBrands,
                              directGroups: filteredDirectGroups,
                              expanded: query ? true : cat.expanded
                        });
                  }
            }

            return result;
      });

      // Overall tree statistics
      stats = computed<TreeStatistics>(() => {
            return computeTreeStats(this.filteredTree());
      });

      private checkStockFilter(stock: number, filter: string): boolean {
            if (!filter) return true;
            if (filter === 'in-stock') return stock > 0;
            if (filter === 'low') return stock > 0 && stock <= 10;
            if (filter === 'critical') return stock > 0 && stock <= 5;
            if (filter === 'outofstock') return stock === 0;
            return true;
      }

      // Node toggle handlers
      toggleCategory(category: CategoryNode, event?: Event): void {
            if (event) event.stopPropagation();
            this.treeData.update(tree =>
                  tree.map(c => (c.id === category.id ? { ...c, expanded: !c.expanded } : c))
            );
      }

      toggleBrand(category: CategoryNode, brand: BrandNode, event?: Event): void {
            if (event) event.stopPropagation();
            this.treeData.update(tree =>
                  tree.map(c => {
                        if (c.id !== category.id) return c;
                        return {
                              ...c,
                              brands: (c.brands || []).map(b =>
                                    b.id === brand.id ? { ...b, expanded: !b.expanded } : b
                              )
                        };
                  })
            );
      }

      toggleGroup(category: CategoryNode, brand: BrandNode | null, group: ProductGroupNode, event?: Event): void {
            if (event) event.stopPropagation();
            this.treeData.update(tree =>
                  tree.map(c => {
                        if (c.id !== category.id) return c;

                        if (brand) {
                              return {
                                    ...c,
                                    brands: (c.brands || []).map(b => {
                                          if (b.id !== brand.id) return b;
                                          return {
                                                ...b,
                                                groups: (b.groups || []).map(g =>
                                                      g.id === group.id ? { ...g, expanded: !g.expanded } : g
                                                )
                                          };
                                    })
                              };
                        } else {
                              return {
                                    ...c,
                                    directGroups: (c.directGroups || []).map(g =>
                                          g.id === group.id ? { ...g, expanded: !g.expanded } : g
                                    )
                              };
                        }
                  })
            );
      }

      // Expand / Collapse All
      expandAll(): void {
            this.treeData.update(tree =>
                  tree.map(c => ({
                        ...c,
                        expanded: true,
                        brands: (c.brands || []).map(b => ({
                              ...b,
                              expanded: true,
                              groups: (b.groups || []).map(g => ({ ...g, expanded: true }))
                        })),
                        directGroups: (c.directGroups || []).map(g => ({ ...g, expanded: true }))
                  }))
            );
      }

      collapseAll(): void {
            this.treeData.update(tree =>
                  tree.map(c => ({
                        ...c,
                        expanded: false,
                        brands: (c.brands || []).map(b => ({
                              ...b,
                              expanded: false,
                              groups: (b.groups || []).map(g => ({ ...g, expanded: false }))
                        })),
                        directGroups: (c.directGroups || []).map(g => ({ ...g, expanded: false }))
                  }))
            );
      }

      // Search & Filters controls
      onSearchInput(event: Event): void {
            const input = event.target as HTMLInputElement;
            this.searchQuery.set(input.value);
      }

      clearSearch(): void {
            this.searchQuery.set('');
      }

      onCategoryFilterChange(val: string): void {
            this.selectedCategoryId.set(val);
      }

      onStockFilterChange(val: string): void {
            this.selectedStockFilter.set(val);
      }

      clearAllFilters(): void {
            this.searchQuery.set('');
            this.selectedCategoryId.set('');
            this.selectedStockFilter.set('');
      }

      hasActiveFilters(): boolean {
            return !!(this.searchQuery() || this.selectedCategoryId() || this.selectedStockFilter());
      }

      // Row Actions
      onViewProduct(product: TreeProductItem): void {
            this.router.navigate(['/pos/product/manage', product.id]);
      }

      onEditProduct(product: TreeProductItem): void {
            this.router.navigate(['/pos/product/manage', product.id]);
      }

      onDeleteProduct(product: TreeProductItem, group: ProductGroupNode, event?: Event): void {
            if (event) event.stopPropagation();
            if (confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`)) {
                  this.removeProductFromTree(product.id);
            }
      }

      private removeProductFromTree(productId: number | string): void {
            this.treeData.update(tree =>
                  tree.map(cat => ({
                        ...cat,
                        brands: (cat.brands || []).map(brand => ({
                              ...brand,
                              groups: (brand.groups || []).map(group => ({
                                    ...group,
                                    products: (group.products || []).filter(p => p.id !== productId)
                              }))
                        })),
                        directGroups: (cat.directGroups || []).map(group => ({
                              ...group,
                              products: (group.products || []).filter(p => p.id !== productId)
                        }))
                  }))
            );
      }

      toggleMenu(productId: number | string, event: Event): void {
            event.stopPropagation();
            this.openMenuProductId.set(this.openMenuProductId() === productId ? null : productId);
      }

      togglePricePopover(productId: number | string, event: Event): void {
            event.stopPropagation();
            this.activePricePopoverProductId.set(
                  this.activePricePopoverProductId() === productId ? null : productId
            );
      }

      @HostListener('document:click')
      handleDocumentClick(): void {
            this.openMenuProductId.set(null);
            this.activePricePopoverProductId.set(null);
      }

      // Counting helpers for badges
      getCategoryBrandsCount(cat: CategoryNode): number {
            return cat.brands ? cat.brands.length : 0;
      }

      getCategoryGroupsCount(cat: CategoryNode): number {
            let count = cat.directGroups ? cat.directGroups.length : 0;
            if (cat.brands) {
                  for (const b of cat.brands) {
                        count += b.groups ? b.groups.length : 0;
                  }
            }
            return count;
      }

      getCategoryProductsCount(cat: CategoryNode): number {
            let count = 0;
            if (cat.directGroups) {
                  for (const g of cat.directGroups) {
                        count += g.products ? g.products.length : 0;
                  }
            }
            if (cat.brands) {
                  for (const b of cat.brands) {
                        if (b.groups) {
                              for (const g of b.groups) {
                                    count += g.products ? g.products.length : 0;
                              }
                        }
                  }
            }
            return count;
      }

      getBrandProductsCount(brand: BrandNode): number {
            let count = 0;
            if (brand.groups) {
                  for (const g of brand.groups) {
                        count += g.products ? g.products.length : 0;
                  }
            }
            return count;
      }

      // Stock status resolver for product rows
      resolveStockIndicator(stock: number): { statusClass: string; label: string } {
            let statusClass: StockStatus = 'healthy';
            if (stock === 0) statusClass = 'outofstock';
            else if (stock <= 5) statusClass = 'critical';
            else if (stock <= 15) statusClass = 'low';

            const label = stock === 0 ? 'نفذ المخزون' : `${stock} وحدة`;
            return { statusClass, label };
      }

      trackByCategoryId(_: number, item: CategoryNode): number | string {
            return item.id;
      }

      trackByBrandId(_: number, item: BrandNode): number | string {
            return item.id;
      }

      trackByGroupId(_: number, item: ProductGroupNode): number | string {
            return item.id;
      }

      trackByProductId(_: number, item: TreeProductItem): number | string {
            return item.id;
      }
}
