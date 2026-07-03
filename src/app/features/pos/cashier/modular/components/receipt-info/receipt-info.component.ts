import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptResponse } from '../../../../core/models/pos.models';

@Component({
      selector: 'app-cashier-receipt-info',
      standalone: true,
      imports: [CommonModule],
      templateUrl: './receipt-info.component.html',
      styleUrls: ['./receipt-info.component.css'],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptInfoComponent {
      @Input() receipt: ReceiptResponse | null = null;

      get today() {
            return new Date();
      }
}
