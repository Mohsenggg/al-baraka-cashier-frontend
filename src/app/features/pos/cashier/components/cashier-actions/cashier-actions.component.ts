import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptResponse, ReceiptMode } from '../../../core/models/pos.models';

@Component({
      selector: 'app-cashier-actions',
      standalone: true,
      imports: [CommonModule],
      templateUrl: './cashier-actions.component.html',
      styles: [`:host { display: contents; }`],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierActionsComponent {
      @Input() receipt: ReceiptResponse | null = null;
      @Input() receiptMode: ReceiptMode = 'NEW';
      @Input() draftsCount = 0;
      @Input() hasStockErrors = false;

      @Output() toggleRightSidebar = new EventEmitter<void>();
      @Output() saveAndPrint = new EventEmitter<void>();
      @Output() save = new EventEmitter<void>();
      @Output() edit = new EventEmitter<void>();
      @Output() newReceipt = new EventEmitter<void>();
      @Output() returnReceipt = new EventEmitter<void>();
      @Output() drafts = new EventEmitter<void>();
      @Output() deleteReceipt = new EventEmitter<void>();
}
