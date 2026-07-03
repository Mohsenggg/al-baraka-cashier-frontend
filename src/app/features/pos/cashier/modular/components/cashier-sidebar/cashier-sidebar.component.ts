import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReceiptListItemDto } from '../../../../core/models/pos.models';

@Component({
  selector: 'app-cashier-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cashier-sidebar.component.html',
  styles: [`:host { display: contents; }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierSidebarComponent {
  private fb = inject(FormBuilder);

  @Input() filteredReceipts: ReceiptListItemDto[] | null = [];
  @Input() loading = false;
  @Input() selectedReceiptId?: number | null;

  @Output() closeSidebar = new EventEmitter<void>();
  @Output() selectReceipt = new EventEmitter<number>();
  @Output() applyFilters = new EventEmitter<any>();
  @Output() clearFilters = new EventEmitter<void>();

  filterForm: FormGroup;
  showFilters = false;

  constructor() {
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

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onApplyFilters() {
    this.applyFilters.emit(this.filterForm.value);
    this.showFilters = false;
  }

  onClearFilters() {
    this.filterForm.reset({ sort: 'receiptDate,DESC' });
    this.clearFilters.emit();
  }

  getPaymentLabel(method: string): string {
    return method === 'CASH' ? 'نقدي' : 'تحويل';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  }
}
