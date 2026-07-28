import { Component, ChangeDetectionStrategy, Output, EventEmitter, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
      selector: 'app-cashier-receipt-input-row',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule],
      templateUrl: './receipt-input-row.component.html',
      styleUrls: ['./receipt-input-row.component.css'],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiptInputRowComponent implements OnInit {
      @Output() add = new EventEmitter<{ barcode: string, quantity: number, sellingPrice?: number }>();
      @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

      inputForm!: FormGroup;

      constructor(private fb: FormBuilder) { }

      ngOnInit() {
            this.inputForm = this.fb.group({
                  barcode: ['', Validators.required],
                  quantity: [1, [Validators.required, Validators.min(1)]],
                  sellingPrice: [{ value: 0, disabled: true }]
            });
      }

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

      submit() {
            if (this.inputForm.valid) {
                  this.add.emit(this.inputForm.getRawValue());
                  this.inputForm.reset({ quantity: 1, sellingPrice: 0, barcode: '' });
                  this.focusSearch();
            }
      }

      focusSearch() {
            setTimeout(() => {
                  this.searchInput?.nativeElement?.focus();
            });
      }
}
