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
import { ReceiptResponse, ReceiptItemResponse } from '../../core/models/pos.models';
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
  private fb = inject(FormBuilder);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Input properties
  @Input() items: ReceiptItemResponse[] = [];
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
  @Output() viewItem = new EventEmitter<ReceiptItemResponse>();
  @Output() updateQuantity = new EventEmitter<{item: ReceiptItemResponse, delta: number}>();
  @Output() addItem = new EventEmitter<{ barcode: string, quantity: number, price?: number }>();

  // Form and state
  inputForm!: FormGroup;
  receipts$ = this.receiptService.receipts$;
  loading$ = this.receiptService.loading$;
  searchControl = new FormControl('');

  // Sidebar navigation items
  navItems = [
    { label: 'الكاشير', icon: '🛒', active: true },
    { label: 'إدارة المخزون', icon: '📦', active: false },
    { label: 'إدارة المشتريات', icon: '🛒', active: false },
    { label: 'تقارير المبيعات', icon: '📊', active: false },
    { label: 'أدوات الطباعة', icon: '🖨️', active: false },
    { label: 'الإعدادات', icon: '⚙️', active: false }
  ];

  get today() {
    return new Date();
  }

  ngOnInit() {
    this.initializeForm();
    this.receiptService.loadReceipts();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.receiptService.loadReceipts(1, 10, value || '');
    });
  }

  private initializeForm() {
    this.inputForm = this.fb.group({
      barcode: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [{ value: 0, disabled: true }]
    });
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

  // Receipt Table Methods
  onRemoveItem(productId: number) {
    this.removeItem.emit(productId);
  }

  onViewItem(item: ReceiptItemResponse) {
    this.viewItem.emit(item);
  }

  onUpdateQuantity(event: {item: ReceiptItemResponse, delta: number}) {
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
    if (this.inputForm.valid) {
      this.addItem.emit(this.inputForm.getRawValue());
      this.inputForm.reset({ quantity: 1, price: 0, barcode: '' });
      this.focusSearch();
    }
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
