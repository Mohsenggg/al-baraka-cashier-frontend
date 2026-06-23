import { Injectable, signal } from '@angular/core';
import {
  MaterialCatalogItem,
  MaterialUnit,
  ProductMaterialRow
} from '../models/product-material.models';

@Injectable({ providedIn: 'root' })
export class ProductMaterialCatalogService {
  private readonly unitsSignal = signal<MaterialUnit[]>([
    { id: 1, name: 'كيلوغرام', abbreviation: 'كغ' },
    { id: 2, name: 'غرام', abbreviation: 'غ' },
    { id: 3, name: 'لتر', abbreviation: 'ل' },
    { id: 4, name: 'مليلتر', abbreviation: 'مل' },
    { id: 5, name: 'قطعة', abbreviation: 'قطعة' },
    { id: 6, name: 'علبة', abbreviation: 'علبة' }
  ]);

  private readonly catalogSignal = signal<MaterialCatalogItem[]>([
    { id: 101, name: 'ماء', barcode: '6281001001011', costPerUnit: 2, defaultUnitId: 3, type: 'raw' },
    { id: 102, name: 'عطر', barcode: '6281001001028', costPerUnit: 20, defaultUnitId: 4, type: 'raw' },
    { id: 103, name: 'زجاجة بلاستيك', barcode: '6281001001035', costPerUnit: 10, defaultUnitId: 5, type: 'inventory' },
    { id: 104, name: 'ملصق', barcode: '6281001001042', costPerUnit: 5, defaultUnitId: 5, type: 'inventory' },
    { id: 105, name: 'غطاء زجاجة', barcode: '6281001001059', costPerUnit: 3, defaultUnitId: 5, type: 'inventory' },
    { id: 106, name: 'مادة فعالة', barcode: '6281001001066', costPerUnit: 35, defaultUnitId: 2, type: 'raw' },
    { id: 107, name: 'مواد حافظة', barcode: '6281001001073', costPerUnit: 8, defaultUnitId: 2, type: 'raw' },
    { id: 108, name: 'صابون خام', barcode: '6281001001080', costPerUnit: 15, defaultUnitId: 1, type: 'raw' }
  ]);

  readonly units = this.unitsSignal.asReadonly();
  readonly catalog = this.catalogSignal.asReadonly();

  searchMaterials(query: string, excludeIds: number[] = [], showAllWhenEmpty = false): MaterialCatalogItem[] {
    const term = query.trim().toLowerCase();
    const available = this.catalog().filter(item => !excludeIds.includes(item.id));

    if (!term) {
      return showAllWhenEmpty ? available : [];
    }

    return available.filter(
      item => item.name.toLowerCase().includes(term) || item.barcode.includes(term)
    );
  }

  getMaterialById(id: number): MaterialCatalogItem | undefined {
    return this.catalog().find(m => m.id === id);
  }

  getUnitById(id: number): MaterialUnit | undefined {
    return this.units().find(u => u.id === id);
  }

  getUnitLabel(unitId: number): string {
    const unit = this.getUnitById(unitId);
    return unit ? unit.name : '—';
  }

  /** Mock loader for edit mode — replace with API call later */
  loadProductMaterials(productId: number): ProductMaterialRow[] {
    if (productId === 15) {
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
    return [];
  }
}
