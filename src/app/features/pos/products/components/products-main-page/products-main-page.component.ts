import { Component, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface DescAttribute {
  id: number;
  name: string;
  value: string;
  ui?: 1 | 2;
}

interface ProductBarcode {
  id: number;
  barcode: string;
  sellingPrice: number;
  buyingPrice: number;
  stock: number;
  default: boolean;
}

interface ProductSummary {
  defaultBarcodeId: number;
  maxSellingPrice: number;
  totalStock: number;
  barcodeCount: number;
}

interface Product {
  id: string;
  name: string;
  descAttributes?: DescAttribute[];
  code: string;
  imageUrl?: string;
  barcodes: ProductBarcode[];
  summary: ProductSummary;
  type: 'inventory' | 'service' | 'bundle' | 'raw';
  status: 'active' | 'inactive' | 'draft';
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
  allProducts = signal<Product[]>([
    {
      id: '1',
      name: 'صابون سائل',
      descAttributes: [
        { id: 1, name: 'Color', value: 'أصفر', ui: 2 },
        { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
      ],
      code: 'WBS-2024-001',
      barcodes: [
        { id: 1, barcode: '6281001001001', sellingPrice: 20.00, buyingPrice: 15.00, stock: 125, default: true }
      ],
      summary: { defaultBarcodeId: 1, maxSellingPrice: 20.00, totalStock: 125, barcodeCount: 1 },
      type: 'inventory',
      status: 'active',
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
      barcodes: [
        { id: 1, barcode: '6281001002001', sellingPrice: 22.00, buyingPrice: 17.00, stock: 30, default: false },
        { id: 2, barcode: '6281001002002', sellingPrice: 25.00, buyingPrice: 19.00, stock: 45, default: true },
        { id: 3, barcode: '6281001002003', sellingPrice: 18.00, buyingPrice: 14.00, stock: 20, default: false }
      ],
      summary: { defaultBarcodeId: 2, maxSellingPrice: 25.00, totalStock: 95, barcodeCount: 3 },
      type: 'inventory',
      status: 'active',
      category: 'electronics',
      minStockLevel: 5,
      maxStockLevel: 50,
      createdAt: new Date('2024-01-10')
    },
    {
      id: '3',
      name: 'كلور سائل',
      descAttributes: [
        { id: 2, name: 'Size', value: 'كيلو', ui: 2 },
        { id: 1, name: 'Type', value: 'عادى', ui: 1 }
      ],
      code: 'SVC-2024-003',
      barcodes: [],
      summary: { defaultBarcodeId: 0, maxSellingPrice: 500.00, totalStock: 1000, barcodeCount: 0 },
      type: 'service',
      status: 'active',
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
      barcodes: [
        { id: 1, barcode: '6281001004001', sellingPrice: 45.00, buyingPrice: 35.00, stock: 1, default: true },
        { id: 2, barcode: '6281001004002', sellingPrice: 48.00, buyingPrice: 38.00, stock: 1, default: false }
      ],
      summary: { defaultBarcodeId: 1, maxSellingPrice: 48.00, totalStock: 2, barcodeCount: 2 },
      type: 'inventory',
      status: 'active',
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
      barcodes: [
        { id: 1, barcode: '6281001005001', sellingPrice: 3500.00, buyingPrice: 3000.00, stock: 5, default: true },
        { id: 2, barcode: '6281001005002', sellingPrice: 3600.00, buyingPrice: 3100.00, stock: 4, default: false },
        { id: 3, barcode: '6281001005003', sellingPrice: 3400.00, buyingPrice: 2900.00, stock: 3, default: false },
        { id: 4, barcode: '6281001005004', sellingPrice: 3550.00, buyingPrice: 3050.00, stock: 3, default: false }
      ],
      summary: { defaultBarcodeId: 1, maxSellingPrice: 3600.00, totalStock: 15, barcodeCount: 4 },
      type: 'bundle',
      status: 'active',
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
      barcodes: [],
      summary: { defaultBarcodeId: 0, maxSellingPrice: 120.00, totalStock: 0, barcodeCount: 0 },
      type: 'raw',
      status: 'inactive',
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
      barcodes: [
        { id: 1, barcode: '123456', sellingPrice: 35.00, buyingPrice: 28.00, stock: 50, default: false },
        { id: 2, barcode: '999999', sellingPrice: 38.00, buyingPrice: 30.00, stock: 60, default: true },
        { id: 3, barcode: '888888', sellingPrice: 32.00, buyingPrice: 25.00, stock: 40, default: false }
      ],
      summary: { defaultBarcodeId: 2, maxSellingPrice: 38.00, totalStock: 150, barcodeCount: 3 },
      type: 'inventory',
      status: 'active',
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
      barcodes: [
        { id: 1, barcode: '6281001008001', sellingPrice: 180.00, buyingPrice: 150.00, stock: 42, default: true }
      ],
      summary: { defaultBarcodeId: 1, maxSellingPrice: 180.00, totalStock: 42, barcodeCount: 1 },
      type: 'inventory',
      status: 'active',
      category: 'accessories',
      minStockLevel: 10,
      maxStockLevel: 100,
      createdAt: new Date('2024-01-30')
    }
  ]);

  isLoading = signal<boolean>(false);
  showAdvancedFilters = signal<boolean>(false);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedType = signal<string>('');
  selectedStockStatus = signal<string>('');

  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()));
  totalProducts = computed(() => this.filteredProducts().length);

  filteredProducts = computed(() => {
    let products = this.allProducts();
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
        const status = this.getStockStatus(p.summary.totalStock, p.minStockLevel, p.maxStockLevel);
        return status === stockStatus;
      });
    }

    return products;
  });

  products = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredProducts().slice(start, end);
  });

  filterForm!: FormGroup;
  hoveredProductId = signal<string>('');
  openMenuId = signal<string | null>(null);
  openBarcodePopoverId = signal<string | null>(null);
  popoverPosition = signal<'up' | 'down'>('down');

  Math = Math;

  constructor(private formBuilder: FormBuilder) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.simulateDataLoad();
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

  private simulateDataLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.update(value => !value);
  }

  applyAdvancedFilters(): void {
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

  private getStockStatus(stock: number, minLevel?: number, maxLevel?: number): string {
    if (stock === 0) return 'outofstock';
    if (minLevel && stock <= minLevel) return 'critical';
    if (minLevel && stock <= minLevel * 1.5) return 'low';
    return 'healthy';
  }

  getStockClass(product: Product): string {
    return this.getStockStatus(product.summary.totalStock, product.minStockLevel, product.maxStockLevel);
  }

  getStockLabel(product: Product): string {
    const stock = product.summary.totalStock;
    if (stock === 0) return '0';
    return `${stock}`;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      inventory: 'منتج مخزون',
      service: 'خدمة',
      bundle: 'حزمة',
      raw: 'مادة خام'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: Product['status']): string {
    const labels: Record<Product['status'], string> = {
      active: 'نشط',
      inactive: 'غير نشط',
      draft: 'مسودة'
    };
    return labels[status];
  }

  getStatusClass(status: Product['status']): string {
    return `status-${status}`;
  }

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

  hasMultipleBarcodes(product: Product): boolean {
    return product.summary.barcodeCount > 1;
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
        
        // If space below is less than 320px and we have more space above, open upwards
        if (spaceBelow < 320 && rect.top > spaceBelow) {
          this.popoverPosition.set('up');
        } else {
          this.popoverPosition.set('down');
        }
      }
    }
  }

  onRowHover(productId: string): void {
    this.hoveredProductId.set(productId);
  }

  onRowLeave(): void {
    this.hoveredProductId.set('');
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
      this.allProducts.update(products =>
        products.filter(p => p.id !== productId)
      );
    }
  }

  getPageNumbers(): number[] {
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
