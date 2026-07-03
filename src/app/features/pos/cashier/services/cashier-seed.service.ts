import { Injectable } from '@angular/core';
import { Product } from '../../core/models/pos.models';

@Injectable({
  providedIn: 'root'
})
export class CashierSeedService {

  // Provide a clean way to mock product details when they are missing from an API response
  public getPlaceholderProduct(overrides?: Partial<Product>): Product {
    return {
      id: 0,
      name: 'Unknown Product',
      barcode: '000000',
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

}
