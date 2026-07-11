import type { ProductMaterialDto } from './product-material.models';

export interface DescAttribute {
      id: number;
      name: string;
      value: string;
      ui?: 1 | 2;
}

export interface ProductBarcode {
      id: number;
      barcode: string;
      sellingPrice: number;
      buyingPrice: number;
      stock: number;
      default: boolean;
}

export interface ProductSummary {
      defaultBarcodeId: number;
      maxSellingPrice: number;
      totalStock: number;
      barcodeCount: number;
}

export type ProductType = 'inventory' | 'service' | 'bundle' | 'raw';
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'deleted';
export type StockStatus = 'healthy' | 'low' | 'critical' | 'outofstock';

export interface ProductListItem {
      id: string;
      name: string;
      descAttributes?: DescAttribute[];
      code: string;
      imageUrl?: string;
      barcodes: ProductBarcode[];
      summary: ProductSummary;
      type: ProductType;
      status: ProductStatus;
      category?: string;
      minStockLevel?: number;
      maxStockLevel?: number;
      createdAt?: Date;
}

export interface ProductFilterParams {
      query?: string;
      category?: string;
      type?: string;
      stockStatus?: string;
      priceMin?: number;
      priceMax?: number;
      stockMin?: number;
      stockMax?: number;
      dateAdded?: string;
}

export interface ProductPagination {
      page: number;
      size: number;
      total: number;
      totalPages: number;
}

/** Flat API DTO — maps to ProductListItem in the state service when backend is connected. */
export interface ProductListItemDto {
      id: string;
      name: string;
      code: string;
      type: ProductType;
      status: ProductStatus;
      category?: string;
      minStockLevel?: number;
      maxStockLevel?: number;
      createdAt?: string;
      descAttributes?: DescAttribute[];
      barcodes?: ProductBarcode[];
      summary?: ProductSummary;
}

export function resolveStockStatus(stock: number, minLevel?: number, _maxLevel?: number): StockStatus {
      if (stock === 0) return 'outofstock';
      if (minLevel && stock <= minLevel) return 'critical';
      if (minLevel && stock <= minLevel * 1.5) return 'low';
      return 'healthy';
}

export function getStockClass(product: ProductListItem): StockStatus {
      return resolveStockStatus(product.summary.totalStock, product.minStockLevel, product.maxStockLevel);
}

export function getStockLabel(product: ProductListItem): string {
      const stock = product.summary.totalStock;
      if (stock === 0) return '0';
      return `${stock}`;
}

export function getTypeLabel(type: string): string {
      const labels: Record<string, string> = {
            inventory: 'منتج مخزون',
            service: 'خدمة',
            bundle: 'حزمة',
            raw: 'مادة خام'
      };
      return labels[type] || type;
}

export function getStatusLabel(status: ProductStatus): string {
      const labels: Record<ProductStatus, string> = {
            active: 'نشط',
            inactive: 'غير نشط',
            draft: 'مسودة',
            deleted: 'محذوف'
      };
      return labels[status];
}

export function getStatusClass(status: ProductStatus): string {
      return `status-${status}`;
}

export function getVisibleDescAttributes(product: ProductListItem): DescAttribute[] {
      if (!product.descAttributes?.length) {
            return [];
      }

      return [...product.descAttributes]
            .filter(attr => attr.ui === 1 || attr.ui === 2)
            .sort((a, b) => (a.ui ?? 99) - (b.ui ?? 99));
}

export function getDescAttrClass(ui?: 1 | 2): string {
      return ui === 1 ? 'desc-attr-primary' : 'desc-attr-secondary';
}

export function hasMultipleBarcodes(product: ProductListItem): boolean {
      return product.summary.barcodeCount > 1;
}

// ─── Product Management (create / edit) ───────────────────────────────────────

export interface ProductAttributeOption {
      id: number;
      name: string;
}

export interface NamedEntity {
      id: number;
      name: string;
}

export interface ProductAttributeFormValue {
      id: number;
      name: string;
      value: string;
}

export interface ProductBarcodeFormValue {
      barcode: string;
      sellingPrice: number;
      buyingPrice: number;
      stock: number;
      isDefault: boolean;
}

/**
 * Describes how a product relates to its parent and its bill-of-materials owner.
 * Supports variant/child products and compound (bundle) composition.
 */
export interface ProductCompositionContext {
      /** The product that owns the BOM (the item being edited). */
      ownerProductId: number | null;
      ownerProductName: string;
      /** Optional parent product when this SKU is a variant/child of another product. */
      parentProductId?: number | null;
      parentProductName?: string;
}

export interface ProductManageDetail {
      id: number;
      baseName: string;
      generatedName?: string;
      attributes: ProductAttributeFormValue[];
      barcodes: ProductBarcodeFormValue[];
      categoryId: number | null;
      manufacturerId: number | null;
      supplierIds: number[];
      composition?: ProductCompositionContext;
}

export interface ProductManagePayload {
      id: number | null;
      name: string;
      baseName: string;
      attributes: ProductAttributeFormValue[];
      barcodes: ProductBarcodeFormValue[];
      categoryId: number | null;
      manufacturerId: number | null;
      supplierIds: number[];
      materials: ProductMaterialDto[];
      composition?: ProductCompositionContext;
}

export interface ProfitMargin {
      value: number;
      percentage: number;
}

export interface ProductReferenceData {
      attributes: ProductAttributeOption[];
      categories: NamedEntity[];
      manufacturers: NamedEntity[];
      suppliers: NamedEntity[];
}

export function calculateProfitMargin(buying: number, selling: number): ProfitMargin {
      if (!buying || buying <= 0) return { value: 0, percentage: 0 };
      const value = selling - buying;
      const percentage = (value / buying) * 100;
      return { value, percentage };
}

export function resolveBarcodeStockStatus(total: number): StockStatus {
      if (total === 0) return 'outofstock';
      if (total <= 10) return 'critical';
      if (total <= 30) return 'low';
      return 'healthy';
}

export function getBarcodeStockLabel(total: number): string {
      if (total === 0) return 'غير متاح';
      return `${total} وحدة`;
}
