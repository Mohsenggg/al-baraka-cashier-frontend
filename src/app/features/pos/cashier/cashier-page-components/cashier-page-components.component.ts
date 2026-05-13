import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ReceiptService } from '../../core/services/receipt.service';
import { ProductService } from '../../core/services/product.service';
import { ReceiptResponse, Product } from '../../core/models/pos.models';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-cashier-page-components',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cashier-page-components.component.html',
  styleUrls: ['./cashier-page-components.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierPageComponentsComponent implements OnInit {
  private receiptService = inject(ReceiptService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Input properties
  @Input() items: any[] = [];
  @Input() receipt: ReceiptResponse | null = null;
  @Input() finalTotal: number = 0;
  @Input() totalQuantity: number = 0;
  @Input() distinctItemsCount: number = 0;
  @Input() totalDiscount: number = 0;
  @Input() tax: number = 0;
  @Input() subtotal: number = 0;
  @Input() draftsCount = 0;
  @Input() sidebarVisible = signal(false);
  @Input() rightSidebarVisible = signal(false);

  // Output events
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleRightSidebar = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() saveAndPrint = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() new = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() return = new EventEmitter<void>();
  @Output() drafts = new EventEmitter<void>();
  @Output() removeItem = new EventEmitter<number>();
  @Output() viewItem = new EventEmitter<any>();
  @Output() updateQuantity = new EventEmitter<any>();
  @Output() addItem = new EventEmitter<{ barcode: string, quantity: number, price?: number }>();
  @Output() previousReceipt = new EventEmitter<void>();
  @Output() nextReceipt = new EventEmitter<void>();

  // Form and state
  inputForm!: FormGroup;
  filterForm!: FormGroup;
  
  receipts$ = this.receiptService.receipts$;
  filteredReceipts$ = this.receiptService.filteredReceipts$;
  loading$ = this.receiptService.loading$;
  pagination$ = this.receiptService.pagination$;
  
  showFilters = signal(false);

  // Local Search state
  searchResults = signal<Product[]>([]);
  selectedSearchIndex = signal<number>(-1);

  // Sidebar navigation items
  navItems = [
    { label: 'الكاشير', icon: 'point_of_sale', active: true },
    { label: 'إدارة المخزون', icon: 'inventory_2', active: false },
    { label: 'إدارة المشتريات', icon: 'shopping_cart', active: false },
    { label: 'تقارير المبيعات', icon: 'bar_chart', active: false },
    { label: 'أدوات الطباعة', icon: 'print', active: false },
    { label: 'الإعدادات', icon: 'settings', active: false }
  ];

  get today() {
    return new Date();
  }

  ngOnInit() {
    this.initializeForm();
    this.initializeFilterForm();
    
    this.setupFilterSubscription();

    // Handle local product search
    this.inputForm.get('barcode')?.valueChanges.subscribe(value => {
      if (typeof value === 'string' && value.trim()) {
        const results = this.productService.searchProducts(value);
        this.searchResults.set(results);
        this.selectedSearchIndex.set(results.length > 0 ? 0 : -1);
      } else {
        this.searchResults.set([]);
        this.selectedSearchIndex.set(-1);
      }
    });
  }

  private initializeForm() {
    this.inputForm = this.fb.group({
      barcode: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [{ value: 0, disabled: true }]
    });
  }

  private initializeFilterForm() {
    this.filterForm = this.fb.group({
      code: [''],
      fromDate: [''],
      toDate: [''],
      totalMin: [null],
      totalMax: [null],
      customerName: [''],
      status: [''],
      paymentMethod: [''],
      sort: ['receiptDate,DESC']
    });
  }

  private setupFilterSubscription() {
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(filters => {
      this.receiptService.filterReceipts({
        ...filters,
        page: 0,
        size: 20
      });
    });

    // Initial load
    this.receiptService.filterReceipts({
      page: 0,
      size: 20,
      sort: 'receiptDate,DESC'
    });
  }

  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  // Action Bar Methods
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onToggleRightSidebar() {
    this.toggleRightSidebar.emit();
  }

  onSave() {
    this.save.emit();
  }

  onSaveAndPrint() {
    this.saveAndPrint.emit();
  }

  onPrint() {
    this.print.emit();
  }

  onNew() {
    this.new.emit();
  }

  onEdit() {
    this.edit.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onReturn() {
    this.return.emit();
  }

  onDrafts() {
    this.drafts.emit();
  }

  onPreviousReceipt() {
    this.previousReceipt.emit();
  }

  onNextReceipt() {
    this.nextReceipt.emit();
  }

  // Receipt Table Methods
  onRemoveItem(productId: number) {
    this.removeItem.emit(productId);
  }

  onViewItem(item: any) {
    this.viewItem.emit(item);
  }

  onUpdateQuantity(event: any) {
    this.updateQuantity.emit(event);
  }

  // Receipt Input Row Methods
  incrementQty() {
    const qty = this.inputForm.get('quantity')?.value || 1;
    this.inputForm.get('quantity')?.setValue(qty + 1);
  }

  decrementQty() {
    const qty = this.inputForm.get('quantity')?.value || 1;
    if (qty > 1) {
      this.inputForm.get('quantity')?.setValue(qty - 1);
    }
  }

  submitInputRow() {
    // Overriding normal submit if search results are active
    const results = this.searchResults();
    if (results.length > 0 && this.selectedSearchIndex() >= 0) {
      this.selectProduct(results[this.selectedSearchIndex()]);
      return;
    }

    if (this.inputForm.valid) {
      this.addItem.emit(this.inputForm.getRawValue());
      this.inputForm.reset({ quantity: 1, price: 0, barcode: '' });
      this.focusSearch();
    }
  }

  onSearchKeyDown(event: KeyboardEvent) {
    const results = this.searchResults();
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSearchIndex.update(idx => (idx + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSearchIndex.update(idx => (idx - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedSearchIndex() >= 0) {
        this.selectProduct(results[this.selectedSearchIndex()]);
      }
    }
  }

  selectProduct(product: Product) {
    // Get quantity if it was manually entered
    const qty = this.inputForm.get('quantity')?.value || 1;
    this.receiptService.addCartItem(product, qty);
    
    // Reset and focus
    this.inputForm.patchValue({ barcode: '', quantity: 1, price: 0 });
    this.searchResults.set([]);
    this.selectedSearchIndex.set(-1);
    this.focusSearch();
  }

  focusSearch() {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    });
  }

  // Receipt Sidebar Methods
  onSelectReceipt(id: number) {
    this.receiptService.getReceipt(id).subscribe();
  }

  getPaymentLabel(method: string): string {
    return method === 'CASH' ? 'نقدي' : 'تحويل';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  }

  // Sidebar close handler
  onCloseSidebar() {
    this.toggleSidebar.emit();
  }

  onCloseReceiptSidebar() {
    this.toggleRightSidebar.emit();
  }
}
