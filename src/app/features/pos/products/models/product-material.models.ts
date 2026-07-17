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

export interface ProductCompositionRow {
  materialId: number;
  materialName: string;
  quantity: number;
  unitId: number;
  costPerUnit: number;
  wastePercentage: number | null;
  notes: string;
}

export interface ProductCompositionDto {
  materialId: number;
  quantity: number;
  unitId: number;
  wastePercentage?: number | null;
  notes?: string;
}
