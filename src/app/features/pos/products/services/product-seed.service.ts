import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import type { ProductListItem } from '../models/product.models';

@Injectable({
      providedIn: 'root'
})
export class ProductSeedService {

      /** Simulated network delay matching the original component behavior. */
      private readonly loadDelayMs = 500;

      public getProducts(): Observable<ProductListItem[]> {
            return of(this.getSeedProducts()).pipe(delay(this.loadDelayMs));
      }

      public getSeedProducts(): ProductListItem[] {
            return [
                  {
                        id: '1',
                        name: 'صابون سائل',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'أصفر', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'WBS-2024-001',
                        barcodes: [
                              { id: 1, barcode: '6281001001001', sellingPrice: 20.00, buyingPrice: 15.00, stock: 125, default: true }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 20.00, totalStock: 125, barcodeCount: 1 },
                        type: 'inventory',
                        status: 'active',
                        category: 'electronics',
                        minStockLevel: 10,
                        maxStockLevel: 500,
                        createdAt: new Date('2024-01-15')
                  },
                  {
                        id: '2',
                        name: 'صابون سائل',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'أخضر', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'TRP-2024-002',
                        barcodes: [
                              { id: 1, barcode: '6281001002001', sellingPrice: 22.00, buyingPrice: 17.00, stock: 30, default: false },
                              { id: 2, barcode: '6281001002002', sellingPrice: 25.00, buyingPrice: 19.00, stock: 45, default: true },
                              { id: 3, barcode: '6281001002003', sellingPrice: 18.00, buyingPrice: 14.00, stock: 20, default: false }
                        ],
                        summary: { defaultBarcodeId: 2, maxSellingPrice: 25.00, totalStock: 95, barcodeCount: 3 },
                        type: 'inventory',
                        status: 'active',
                        category: 'electronics',
                        minStockLevel: 5,
                        maxStockLevel: 50,
                        createdAt: new Date('2024-01-10')
                  },
                  {
                        id: '3',
                        name: 'كلور سائل',
                        descAttributes: [
                              { id: 2, name: 'Size', value: 'كيلو', ui: 2 },
                              { id: 1, name: 'Type', value: 'عادى', ui: 1 }
                        ],
                        code: 'SVC-2024-003',
                        barcodes: [],
                        summary: { defaultBarcodeId: 0, maxSellingPrice: 500.00, totalStock: 1000, barcodeCount: 0 },
                        type: 'service',
                        status: 'active',
                        category: 'services',
                        createdAt: new Date('2024-02-01')
                  },
                  {
                        id: '4',
                        name: 'كلور سائل',
                        descAttributes: [
                              { id: 1, name: 'Type', value: 'مركز', ui: 1 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 2 }
                        ],
                        code: 'BLR-2024-004',
                        barcodes: [
                              { id: 1, barcode: '6281001004001', sellingPrice: 45.00, buyingPrice: 35.00, stock: 1, default: true },
                              { id: 2, barcode: '6281001004002', sellingPrice: 48.00, buyingPrice: 38.00, stock: 1, default: false }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 48.00, totalStock: 2, barcodeCount: 2 },
                        type: 'inventory',
                        status: 'active',
                        category: 'supplies',
                        minStockLevel: 20,
                        maxStockLevel: 200,
                        createdAt: new Date('2024-01-20')
                  },
                  {
                        id: '5',
                        name: 'كلور سائل',
                        descAttributes: [
                              { id: 1, name: 'Type', value: 'مركز', ui: 1 },
                              { id: 2, name: 'Size', value: 'جمدانة', ui: 2 }
                        ],
                        code: 'BND-2024-005',
                        barcodes: [
                              { id: 1, barcode: '6281001005001', sellingPrice: 3500.00, buyingPrice: 3000.00, stock: 5, default: true },
                              { id: 2, barcode: '6281001005002', sellingPrice: 3600.00, buyingPrice: 3100.00, stock: 4, default: false },
                              { id: 3, barcode: '6281001005003', sellingPrice: 3400.00, buyingPrice: 2900.00, stock: 3, default: false },
                              { id: 4, barcode: '6281001005004', sellingPrice: 3550.00, buyingPrice: 3050.00, stock: 3, default: false }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 3600.00, totalStock: 15, barcodeCount: 4 },
                        type: 'bundle',
                        status: 'active',
                        category: 'electronics',
                        createdAt: new Date('2024-02-05')
                  },
                  {
                        id: '6',
                        name: 'ألمنيوم مركب (خام)',
                        descAttributes: [
                              { id: 1, name: 'Description', value: 'مادة خام للتصنيع والإنتاج', ui: 1 }
                        ],
                        code: 'RAW-2024-006',
                        barcodes: [],
                        summary: { defaultBarcodeId: 0, maxSellingPrice: 120.00, totalStock: 0, barcodeCount: 0 },
                        type: 'raw',
                        status: 'inactive',
                        category: 'materials',
                        minStockLevel: 50,
                        maxStockLevel: 500,
                        createdAt: new Date('2024-01-25')
                  },
                  {
                        id: '7',
                        name: 'سلفونيك',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'شفاف', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'USB-2024-007',
                        barcodes: [
                              { id: 1, barcode: '123456', sellingPrice: 35.00, buyingPrice: 28.00, stock: 50, default: false },
                              { id: 2, barcode: '999999', sellingPrice: 38.00, buyingPrice: 30.00, stock: 60, default: true },
                              { id: 3, barcode: '888888', sellingPrice: 32.00, buyingPrice: 25.00, stock: 40, default: false }
                        ],
                        summary: { defaultBarcodeId: 2, maxSellingPrice: 38.00, totalStock: 150, barcodeCount: 3 },
                        type: 'inventory',
                        status: 'active',
                        category: 'accessories',
                        minStockLevel: 100,
                        maxStockLevel: 1000,
                        createdAt: new Date('2024-02-10')
                  },
                  {
                        id: '8',
                        name: 'سلفونيك',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'شفاف', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'DRW-2024-008',
                        barcodes: [
                              { id: 1, barcode: '6281001008001', sellingPrice: 180.00, buyingPrice: 150.00, stock: 42, default: true }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 180.00, totalStock: 42, barcodeCount: 1 },
                        type: 'inventory',
                        status: 'active',
                        category: 'accessories',
                        minStockLevel: 10,
                        maxStockLevel: 100,
                        createdAt: new Date('2024-01-30')
                  },
                  {
                        id: '9',
                        name: 'صابون سائل',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'أصفر', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'WBS-2024-001',
                        barcodes: [
                              { id: 1, barcode: '6281001001001', sellingPrice: 20.00, buyingPrice: 15.00, stock: 125, default: true }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 20.00, totalStock: 125, barcodeCount: 1 },
                        type: 'inventory',
                        status: 'active',
                        category: 'electronics',
                        minStockLevel: 10,
                        maxStockLevel: 500,
                        createdAt: new Date('2024-01-15')
                  },
                  {
                        id: '10',
                        name: 'صابون سائل',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'أخضر', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'TRP-2024-002',
                        barcodes: [
                              { id: 1, barcode: '6281001002001', sellingPrice: 22.00, buyingPrice: 17.00, stock: 30, default: false },
                              { id: 2, barcode: '6281001002002', sellingPrice: 25.00, buyingPrice: 19.00, stock: 45, default: true },
                              { id: 3, barcode: '6281001002003', sellingPrice: 18.00, buyingPrice: 14.00, stock: 20, default: false }
                        ],
                        summary: { defaultBarcodeId: 2, maxSellingPrice: 25.00, totalStock: 95, barcodeCount: 3 },
                        type: 'inventory',
                        status: 'active',
                        category: 'electronics',
                        minStockLevel: 5,
                        maxStockLevel: 50,
                        createdAt: new Date('2024-01-10')
                  },
                  {
                        id: '11',
                        name: 'كلور سائل',
                        descAttributes: [
                              { id: 2, name: 'Size', value: 'كيلو', ui: 2 },
                              { id: 1, name: 'Type', value: 'عادى', ui: 1 }
                        ],
                        code: 'SVC-2024-003',
                        barcodes: [],
                        summary: { defaultBarcodeId: 0, maxSellingPrice: 500.00, totalStock: 1000, barcodeCount: 0 },
                        type: 'service',
                        status: 'active',
                        category: 'services',
                        createdAt: new Date('2024-02-01')
                  },
                  {
                        id: '12',
                        name: 'كلور سائل',
                        descAttributes: [
                              { id: 1, name: 'Type', value: 'مركز', ui: 1 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 2 }
                        ],
                        code: 'BLR-2024-004',
                        barcodes: [
                              { id: 1, barcode: '6281001004001', sellingPrice: 45.00, buyingPrice: 35.00, stock: 1, default: true },
                              { id: 2, barcode: '6281001004002', sellingPrice: 48.00, buyingPrice: 38.00, stock: 1, default: false }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 48.00, totalStock: 2, barcodeCount: 2 },
                        type: 'inventory',
                        status: 'active',
                        category: 'supplies',
                        minStockLevel: 20,
                        maxStockLevel: 200,
                        createdAt: new Date('2024-01-20')
                  },
                  {
                        id: '13',
                        name: 'كلور سائل',
                        descAttributes: [
                              { id: 1, name: 'Type', value: 'مركز', ui: 1 },
                              { id: 2, name: 'Size', value: 'جمدانة', ui: 2 }
                        ],
                        code: 'BND-2024-005',
                        barcodes: [
                              { id: 1, barcode: '6281001005001', sellingPrice: 3500.00, buyingPrice: 3000.00, stock: 5, default: true },
                              { id: 2, barcode: '6281001005002', sellingPrice: 3600.00, buyingPrice: 3100.00, stock: 4, default: false },
                              { id: 3, barcode: '6281001005003', sellingPrice: 3400.00, buyingPrice: 2900.00, stock: 3, default: false },
                              { id: 4, barcode: '6281001005004', sellingPrice: 3550.00, buyingPrice: 3050.00, stock: 3, default: false }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 3600.00, totalStock: 15, barcodeCount: 4 },
                        type: 'bundle',
                        status: 'active',
                        category: 'electronics',
                        createdAt: new Date('2024-02-05')
                  },
                  {
                        id: '14',
                        name: 'ألمنيوم مركب (خام)',
                        descAttributes: [
                              { id: 1, name: 'Description', value: 'مادة خام للتصنيع والإنتاج', ui: 1 }
                        ],
                        code: 'RAW-2024-006',
                        barcodes: [],
                        summary: { defaultBarcodeId: 0, maxSellingPrice: 120.00, totalStock: 0, barcodeCount: 0 },
                        type: 'raw',
                        status: 'inactive',
                        category: 'materials',
                        minStockLevel: 50,
                        maxStockLevel: 500,
                        createdAt: new Date('2024-01-25')
                  },
                  {
                        id: '15',
                        name: 'سلفونيك',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'شفاف', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'USB-2024-007',
                        barcodes: [
                              { id: 1, barcode: '123456', sellingPrice: 35.00, buyingPrice: 28.00, stock: 50, default: false },
                              { id: 2, barcode: '999999', sellingPrice: 38.00, buyingPrice: 30.00, stock: 60, default: true },
                              { id: 3, barcode: '888888', sellingPrice: 32.00, buyingPrice: 25.00, stock: 40, default: false }
                        ],
                        summary: { defaultBarcodeId: 2, maxSellingPrice: 38.00, totalStock: 150, barcodeCount: 3 },
                        type: 'inventory',
                        status: 'active',
                        category: 'accessories',
                        minStockLevel: 100,
                        maxStockLevel: 1000,
                        createdAt: new Date('2024-02-10')
                  },
                  {
                        id: '16',
                        name: 'سلفونيك',
                        descAttributes: [
                              { id: 1, name: 'Color', value: 'شفاف', ui: 2 },
                              { id: 2, name: 'Size', value: 'كيلو', ui: 1 }
                        ],
                        code: 'DRW-2024-008',
                        barcodes: [
                              { id: 1, barcode: '6281001008001', sellingPrice: 180.00, buyingPrice: 150.00, stock: 42, default: true }
                        ],
                        summary: { defaultBarcodeId: 1, maxSellingPrice: 180.00, totalStock: 42, barcodeCount: 1 },
                        type: 'inventory',
                        status: 'active',
                        category: 'accessories',
                        minStockLevel: 10,
                        maxStockLevel: 100,
                        createdAt: new Date('2024-01-30')
                  }
            ];
      }

      public getProductById(id: string): ProductListItem | undefined {
            return this.getSeedProducts().find(p => p.id === id);
      }
}
