import { Component, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

// Types for Product Model
interface DescAttribute {
  id: number;
  name: string;
  value: string;
  ui?: 1 | 2;
}

interface Product {
  id: string;
  name: string;
  descAttributes?: DescAttribute[];
  code: string;
  imageUrl?: string;
  barcodeCount: number;
  sellingPrice: number;
  stock: number;
  type: 'inventory' | 'service' | 'bundle' | 'raw';
  category?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  createdAt?: Date;
}

@Component({
  selector: 'app-products-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products-main-page.component.html',
  styleUrl: './products-main-page.component.css'
})
export class ProductsMainPageComponent implements OnInit {
  // ===========================
  // SIGNALS FOR STATE MANAGEMENT
  // ===========================

  // Product data
  allProducts = signal<Product[]>([
    {
      id: '1',
      name: 'صابون سائل',
      descAttributes: [
        { id: 1, name: 'Color', value: 'أصفر', ui: 2 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
      ],
      code: 'WBS-2024-001',
      imageUrl: undefined,
      barcodeCount: 1,
      sellingPrice: 20.00,
      stock: 125,
      type: 'inventory',
      category: 'electronics',
      minStockLevel: 10,
      maxStockLevel: 500,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'صابون سائل',
      descAttributes: [
        { id: 1, name: 'Color', value: 'أخضر', ui: 2 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
      ],
      code: 'TRP-2024-002',
      imageUrl: undefined,
      barcodeCount: 3,
      sellingPrice: 1200.00,
      stock: 8,
      type: 'inventory',
      category: 'electronics',
      minStockLevel: 5,
      maxStockLevel: 50,
      createdAt: new Date('2024-01-10')
    },
    {
      id: '3',
      name: 'كلور سائل',
      descAttributes: [
        { id: 1, name: 'Type', value: 'عادى', ui: 1 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 2 }
      ],
      code: 'SVC-2024-003',
      imageUrl: undefined,
      barcodeCount: 0,
      sellingPrice: 500.00,
      stock: 1000,
      type: 'service',
      category: 'services',
      createdAt: new Date('2024-02-01')
    },
    {
      id: '4',
      name: 'كلور سائل',
      descAttributes: [
        { id: 1, name: 'Type', value: 'مركز', ui: 1 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 2 }
      ],
      code: 'BLR-2024-004',
      imageUrl: undefined,
      barcodeCount: 5,
      sellingPrice: 45.00,
      stock: 2,
      type: 'inventory',
      category: 'supplies',
      minStockLevel: 20,
      maxStockLevel: 200,
      createdAt: new Date('2024-01-20')
    },
    {
      id: '5',
      name: 'كلور سائل',
      descAttributes: [
        { id: 1, name: 'Type', value: 'مركز', ui: 1 },
        { id: 2, name: 'Size', value: 'جمدانة', ui: 2 }
      ],
      code: 'BND-2024-005',
      imageUrl: undefined,
      barcodeCount: 8,
      sellingPrice: 3500.00,
      stock: 15,
      type: 'bundle',
      category: 'electronics',
      createdAt: new Date('2024-02-05')
    },
    {
      id: '6',
      name: 'ألمنيوم مركب (خام)',
      descAttributes: [
        { id: 1, name: 'Description', value: 'مادة خام للتصنيع والإنتاج', ui: 1 }
      ],
      code: 'RAW-2024-006',
      imageUrl: undefined,
      barcodeCount: 0,
      sellingPrice: 120.00,
      stock: 0,
      type: 'raw',
      category: 'materials',
      minStockLevel: 50,
      maxStockLevel: 500,
      createdAt: new Date('2024-01-25')
    },
    {
      id: '7',
      name: 'سلفونيك',
      descAttributes: [
        { id: 1, name: 'Color', value: 'شفاف', ui: 2 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
      ],
      code: 'USB-2024-007',
      imageUrl: undefined,
      barcodeCount: 2,
      sellingPrice: 35.00,
      stock: 500,
      type: 'inventory',
      category: 'accessories',
      minStockLevel: 100,
      maxStockLevel: 1000,
      createdAt: new Date('2024-02-10')
    },
    {
      id: '8',
      name: 'سلفونيك',
      descAttributes: [
        { id: 1, name: 'Color', value: 'شفاف', ui: 2 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
      ],
      code: 'DRW-2024-008',
      imageUrl: undefined,
      barcodeCount: 1,
      sellingPrice: 180.00,
      stock: 42,
      type: 'inventory',
      category: 'accessories',
      minStockLevel: 10,
      maxStockLevel: 100,
      createdAt: new Date('2024-01-30')
    }
  ]);

  // UI State
  isLoading = signal<boolean>(false);
  showAdvancedFilters = signal<boolean>(false);

  // Search & Filter
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedType = signal<string>('');
  selectedStockStatus = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()));
  totalProducts = computed(() => this.filteredProducts().length);

  // Computed signals for filtering
  filteredProducts = computed(() => {
    let products = this.allProducts();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.descAttributes?.some(attr => attr.value.toLowerCase().includes(query)) ||
        p.code.toLowerCase().includes(query)
      );
    }

    // Category filter
    const category = this.selectedCategory();
    if (category) {
      products = products.filter(p => p.category === category);
    }

    // Type filter
    const type = this.selectedType();
    if (type) {
      products = products.filter(p => p.type === type);
    }

    // Stock status filter
    const stockStatus = this.selectedStockStatus();
    if (stockStatus) {
      products = products.filter(p => {
        const status = this.getStockStatus(p.stock, p.minStockLevel, p.maxStockLevel);
        return status === stockStatus;
      });
    }

    return products;
  });

  // Paginated products
  products = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredProducts().slice(start, end);
  });

  // Form for advanced filters
  filterForm!: FormGroup;

  // Hover state
  hoveredProductId = signal<string>('');

  // Action menu open state (product id or null)
  openMenuId = signal<string | null>(null);

  // Math reference for template
  Math = Math;

  constructor(private formBuilder: FormBuilder) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    // Load products from service (simulated)
    this.simulateDataLoad();
  }

  // ===========================
  // INITIALIZATION
  // ===========================

  private initializeFilterForm(): void {
    this.filterForm = this.formBuilder.group({
      priceMin: [''],
      priceMax: [''],
      stockMin: [''],
      stockMax: [''],
      dateAdded: ['']
    });
  }

  private simulateDataLoad(): void {
    // Simulate loading delay
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  // ===========================
  // SEARCH & FILTER ACTIONS
  // ===========================

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1); // Reset to first page on search
  }

  onFilterChange(): void {
    this.currentPage.set(1); // Reset to first page on filter change
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(value => !value);
  }

  applyAdvancedFilters(): void {
    // Get form values and update filter signals
    const formValue = this.filterForm.value;
    // Implementation for advanced filters
    this.currentPage.set(1);
    this.showAdvancedFilters.set(false);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedType.set('');
    this.selectedStockStatus.set('');
    this.filterForm.reset();
    this.currentPage.set(1);
    this.showAdvancedFilters.set(false);
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery() ||
      this.selectedCategory() ||
      this.selectedType() ||
      this.selectedStockStatus() ||
      Object.values(this.filterForm.value).some(v => v)
    );
  }

  // ===========================
  // STOCK HELPERS
  // ===========================

  private getStockStatus(stock: number, minLevel?: number, maxLevel?: number): string {
    if (stock === 0) return 'outofstock';
    if (minLevel && stock <= minLevel) return 'critical';
    if (minLevel && stock <= minLevel * 1.5) return 'low';
    return 'healthy';
  }

  getStockClass(stock: number): string {
    const status = this.getStockStatus(stock, 10, 50);
    return status;
  }

  getStockLabel(stock: number): string {
    if (stock === 0) return 'غير متاح';
    if (stock <= 10) return `مخزون منخفض (${stock})`;
    if (stock >= 100) return `${stock} وحدة`;
    return `${stock} وحدة`;
  }

  // ===========================
  // TYPE HELPERS
  // ===========================

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      inventory: 'منتج مخزون',
      service: 'خدمة',
      bundle: 'حزمة',
      raw: 'مادة خام'
    };
    return labels[type] || type;
  }

  // ===========================
  // DESCRIPTION ATTRIBUTES
  // ===========================

  getVisibleDescAttributes(product: Product): DescAttribute[] {
    if (!product.descAttributes?.length) {
      return [];
    }

    return [...product.descAttributes]
      .filter(attr => attr.ui === 1 || attr.ui === 2)
      .sort((a, b) => (a.ui ?? 99) - (b.ui ?? 99));
  }

  getDescAttrClass(ui?: 1 | 2): string {
    return ui === 1 ? 'desc-attr-primary' : 'desc-attr-secondary';
  }

  // ===========================
  // ROW HOVER
  // ===========================

  onRowHover(productId: string): void {
    this.hoveredProductId.set(productId);
  }

  onRowLeave(): void {
    this.hoveredProductId.set('');
  }

  toggleMenu(productId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId.set(this.openMenuId() === productId ? null : productId);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(_: Event) {
    this.openMenuId.set(null);
  }

  // ===========================
  // TABLE ACTIONS
  // ===========================

  onViewProduct(productId: string): void {
    console.log('View product:', productId);
    // Navigate to product detail view
  }

  onEditProduct(productId: string): void {
    console.log('Edit product:', productId);
    // Navigate to product edit page
  }

  onDeleteProduct(productId: string): void {
    console.log('Delete product:', productId);
    // Show confirmation and delete
    if (confirm('Are you sure you want to delete this product?')) {
      this.allProducts.update(products =>
        products.filter(p => p.id !== productId)
      );
    }
  }

  // ===========================
  // PAGINATION
  // ===========================

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxDisplay = 5;

    if (total <= maxDisplay) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push(-1); // Separator

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) pages.push(-1); // Separator
    if (end < total) pages.push(total);

    return pages;
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(page: number): void {
    if (page > 0 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}

