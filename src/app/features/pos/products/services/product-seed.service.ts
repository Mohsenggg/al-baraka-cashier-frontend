import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import type {
      ProductListItem,
      ProductManageDetail,
      ProductManagePayload,
      ProductReferenceData
} from '../models/product.models';
import type { MaterialCatalogItem, MaterialUnit, ProductMaterialRow } from '../models/product-material.models';

@Injectable({
      providedIn: 'root'
})
export class ProductSeedService {

      /** Simulated network delay matching the original component behavior. */
      private readonly loadDelayMs = 500;
      private readonly editLoadDelayMs = 400;
      private readonly saveDelayMs = 800;

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

      // ─── Product Management Seeds ───────────────────────────────────────────

      public getReferenceData(): ProductReferenceData {
            return {
                  attributes: [
                        { id: 1, name: 'اللون' },
                        { id: 2, name: 'الوزن' },
                        { id: 3, name: 'الرائحة' },
                        { id: 4, name: 'الخامة' },
                        { id: 5, name: 'المقاس' },
                        { id: 6, name: 'الماركة' }
                  ],
                  categories: [
                        { id: 1, name: 'الكترونيات' },
                        { id: 2, name: 'منظفات' },
                        { id: 3, name: 'مواد غذائية' }
                  ],
                  manufacturers: [
                        { id: 1, name: 'شركة أ' },
                        { id: 2, name: 'شركة ب' }
                  ],
                  suppliers: [
                        { id: 1, name: 'مورد 1' },
                        { id: 2, name: 'مورد 2' },
                        { id: 3, name: 'مورد 3' }
                  ]
            };
      }

      public getMaterialUnits(): MaterialUnit[] {
            return [
                  { id: 1, name: 'كيلوغرام', abbreviation: 'كغ' },
                  { id: 2, name: 'غرام', abbreviation: 'غ' },
                  { id: 3, name: 'لتر', abbreviation: 'ل' },
                  { id: 4, name: 'مليلتر', abbreviation: 'مل' },
                  { id: 5, name: 'قطعة', abbreviation: 'قطعة' },
                  { id: 6, name: 'علبة', abbreviation: 'علبة' }
            ];
      }

      public getMaterialCatalog(): MaterialCatalogItem[] {
            return [
                  { id: 101, name: 'ماء', barcode: '6281001001011', costPerUnit: 2, defaultUnitId: 3, type: 'raw' },
                  { id: 102, name: 'عطر', barcode: '6281001001028', costPerUnit: 20, defaultUnitId: 4, type: 'raw' },
                  { id: 103, name: 'زجاجة بلاستيك', barcode: '6281001001035', costPerUnit: 10, defaultUnitId: 5, type: 'inventory' },
                  { id: 104, name: 'ملصق', barcode: '6281001001042', costPerUnit: 5, defaultUnitId: 5, type: 'inventory' },
                  { id: 105, name: 'غطاء زجاجة', barcode: '6281001001059', costPerUnit: 3, defaultUnitId: 5, type: 'inventory' },
                  { id: 106, name: 'مادة فعالة', barcode: '6281001001066', costPerUnit: 35, defaultUnitId: 2, type: 'raw' },
                  { id: 107, name: 'مواد حافظة', barcode: '6281001001073', costPerUnit: 8, defaultUnitId: 2, type: 'raw' },
                  { id: 108, name: 'صابون خام', barcode: '6281001001080', costPerUnit: 15, defaultUnitId: 1, type: 'raw' }
            ];
      }

      public getProductForEdit(id: number): Observable<ProductManageDetail | null> {
            const detail = this.getSeedProductDetail(id);
            return of(detail).pipe(delay(this.editLoadDelayMs));
      }

      public getProductMaterials(productId: number): Observable<ProductMaterialRow[]> {
            return of(this.getSeedProductMaterials(productId)).pipe(delay(this.editLoadDelayMs));
      }

      public saveProduct(payload: ProductManagePayload): Observable<ProductManagePayload> {
            return of(payload).pipe(delay(this.saveDelayMs));
      }

      private getSeedProductDetail(id: number): ProductManageDetail | null {
            if (id !== 15) return null;

            return {
                  id: 15,
                  baseName: 'شامبو',
                  generatedName: 'شامبو',
                  attributes: [],
                  barcodes: [],
                  categoryId: null,
                  manufacturerId: null,
                  supplierIds: [],
                  composition: {
                        ownerProductId: 15,
                        ownerProductName: 'شامبو',
                        parentProductId: null,
                        parentProductName: undefined
                  }
            };
      }

      private getSeedProductMaterials(productId: number): ProductMaterialRow[] {
            if (productId !== 15) return [];

            return [
                  {
                        materialId: 103,
                        materialName: 'زجاجة بلاستيك',
                        parentProductId: 15,
                        parentProductName: 'شامبو 500مل',
                        quantity: 1,
                        unitId: 5,
                        costPerUnit: 10,
                        wastePercentage: 2,
                        notes: ''
                  },
                  {
                        materialId: 104,
                        materialName: 'ملصق',
                        parentProductId: 15,
                        parentProductName: 'شامبو 500مل',
                        quantity: 1,
                        unitId: 5,
                        costPerUnit: 5,
                        wastePercentage: 5,
                        notes: 'ملصق أمامي'
                  },
                  {
                        materialId: 102,
                        materialName: 'عطر',
                        parentProductId: 15,
                        parentProductName: 'شامبو 500مل',
                        quantity: 50,
                        unitId: 4,
                        costPerUnit: 20,
                        wastePercentage: 3,
                        notes: ''
                  }
            ];
      }
}
