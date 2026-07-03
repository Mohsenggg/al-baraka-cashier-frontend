import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptItemResponse } from '../../../core/models/pos.models';

@Component({
      selector: 'app-cashier-receipt-table',
      standalone: true,
      imports: [CommonModule],
      templateUrl: './receipt-table.component.html',
      styleUrls: ['./receipt-table.component.css'],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptTableComponent {
      @Input() items: ReceiptItemResponse[] = [];
      @Output() removeItem = new EventEmitter<number>();
      @Output() viewItem = new EventEmitter<ReceiptItemResponse>();
      @Output() updateQuantity = new EventEmitter<{ item: ReceiptItemResponse, delta: number }>();
}
