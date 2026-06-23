export interface MaterialUnit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface MaterialCatalogItem {
  id: number;
  name: string;
  barcode: string;
  costPerUnit: number;
  defaultUnitId: number;
  type: 'raw' | 'inventory';
}

export interface ProductMaterialRow {
  materialId: number;
  materialName: string;
  parentProductId: number | null;
  parentProductName: string;
  quantity: number;
  unitId: number;
  costPerUnit: number;
  wastePercentage: number | null;
  notes: string;
}

export interface ProductMaterialDto {
  materialId: number;
  quantity: number;
  unitId: number;
  wastePercentage?: number | null;
  notes?: string;
}

export interface ProductMaterialsPayload {
  id?: number;
  name: string;
  materials: ProductMaterialDto[];
}
