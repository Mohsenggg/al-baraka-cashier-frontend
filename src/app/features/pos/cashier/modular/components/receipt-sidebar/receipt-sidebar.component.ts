import { Component, ChangeDetectionStrategy, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ReceiptService } from '../../../../core/services/receipt.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
      selector: 'app-cashier-receipt-sidebar',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule],
      templateUrl: './receipt-sidebar.component.html',
      styleUrls: ['./receipt-sidebar.component.css'],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptSidebarComponent implements OnInit {
      private receiptService = inject(ReceiptService);

      @Output() close = new EventEmitter<void>();

      receipts$ = this.receiptService.receipts$;
      loading$ = this.receiptService.loading$;
      searchControl = new FormControl('');

      ngOnInit() {
            this.receiptService.loadReceipts();

            this.searchControl.valueChanges.pipe(
                  debounceTime(300),
                  distinctUntilChanged()
            ).subscribe(value => {
                  this.receiptService.loadReceipts(1, 10, value || '');
            });
      }

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
}
