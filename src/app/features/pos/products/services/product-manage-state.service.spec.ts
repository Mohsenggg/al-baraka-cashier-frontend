/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductManageStateService } from './product-manage-state.service';
import { ProductApiService } from './product-api.service';

describe('ProductManageStateService', () => {
  let service: ProductManageStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [{ provide: ProductApiService, useValue: {} }]
    });

    service = TestBed.inject(ProductManageStateService);
    service.initialize();
  });

  it('should enable conversion state when the first conversion row is added', () => {
    expect(service.productForm.get('hasConversion')?.value).toBeFalse();

    service.addConversion();

    expect(service.conversionsFormArray.length).toBe(1);
    expect(service.productForm.get('hasConversion')?.value).toBeTrue();

    const payload = service.buildProductPayload();
    expect(payload.hasConversion).toBeTrue();
    expect(payload.conversions.length).toBe(1);
  });

  it('should disable conversion state when the last conversion row is removed', () => {
    service.addConversion();

    service.removeConversion(0);

    expect(service.conversionsFormArray.length).toBe(0);
    expect(service.productForm.get('hasConversion')?.value).toBeFalse();

    const payload = service.buildProductPayload();
    expect(payload.hasConversion).toBeFalse();
    expect(payload.conversions).toEqual([]);
  });
});
