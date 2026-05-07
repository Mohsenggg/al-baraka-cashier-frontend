import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cashier-totals-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './totals-bar.component.html',
  styleUrls: ['./totals-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalsBarComponent {
  @Input() finalTotal: number = 0;
  @Input() totalQuantity: number = 0;
  @Input() distinctItemsCount: number = 0;
  @Input() totalDiscount: number = 0;
  @Input() tax: number = 0;
  @Input() subtotal: number = 0;
}
