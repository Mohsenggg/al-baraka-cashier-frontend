# Products Backend API Contract

This specification is derived from the frontend **Products** module architecture
(`ProductStateService`, `ProductManageStateService`, `ProductApiService`) and is
designed for an enterprise POS / inventory management system.

> **Base path:** `/api/products`  
> **Pagination:** 0-based page index (consistent with Receipt API)  
> **Error format:** `ErrorResponseDTO` (same as Cashier module)  
> **Paginated responses:** `PageResponseDto<T>` (Spring Data shape used by Receipt API)

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Shared DTOs & Enums](#2-shared-dtos--enums)
3. [Product List & Search](#3-product-list--search)
4. [Product Lookup](#4-product-lookup)
5. [Product Management (CRUD Aggregate)](#5-product-management-crud-aggregate)
6. [Product Composition & Parent/Child](#6-product-composition--parentchild)
7. [Bill of Materials (BOM)](#7-bill-of-materials-bom)
8. [Barcodes](#8-barcodes)
9. [Reference Data](#9-reference-data)
10. [Material Catalog](#10-material-catalog)
11. [Inventory Operations](#11-inventory-operations)
12. [Cashier Integration (Legacy Slim Endpoints)](#12-cashier-integration-legacy-slim-endpoints)
13. [Frontend Mapping Notes](#13-frontend-mapping-notes)

---

## 1. Conventions

### 1.1 HTTP Headers

| Header | Value | Notes |
|--------|-------|-------|
| `Content-Type` | `application/json` | Required on POST/PUT/PATCH |
| `Accept` | `application/json` | Recommended |
| `Accept-Language` | `ar`, `en` | Optional — for localized error messages |

### 1.2 Error Response (`ErrorResponseDTO`)

All error responses use this structure:

```json
{
  "message": "Human-readable summary",
  "status": 400,
  "timestamp": "2026-07-11T01:42:00",
  "errors": {
    "baseName": "اسم المنتج مطلوب",
    "barcodes[0].barcode": "الباركود مطلوب"
  }
}
```

| HTTP Status | When |
|-------------|------|
| `400 Bad Request` | Validation failure, business rule violation |
| `404 Not Found` | Product, material, or reference entity not found |
| `409 Conflict` | Duplicate code/barcode, circular parent reference |
| `422 Unprocessable Entity` | Composition/BOM integrity violation |
| `500 Internal Server Error` | Unexpected server failure |

### 1.3 Pagination (`PageResponseDto<T>`)

```json
{
  "content": [],
  "totalElements": 156,
  "totalPages": 8,
  "size": 20,
  "number": 0,
  "page": 0,
  "last": false,
  "first": true,
  "hasNext": true,
  "hasPrevious": false,
  "numberOfElements": 20,
  "empty": false
}
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page` | integer | `0` | 0-based page index |
| `size` | integer | `20` | Page size (max `100`) |
| `sort` | string | `createdAt,DESC` | Spring-style: `field,direction` |

**Supported sort fields (list):** `name`, `code`, `createdAt`, `maxSellingPrice`, `totalStock`, `type`, `status`

### 1.4 Domain Enums

```typescript
type ProductType   = 'inventory' | 'service' | 'bundle' | 'raw';
type ProductStatus = 'active' | 'inactive' | 'draft' | 'deleted';
type StockStatus   = 'healthy' | 'low' | 'critical' | 'outofstock';
type MaterialType  = 'raw' | 'inventory';
```

**Stock status** is computed server-side using the same rules as the frontend:

| Condition | Status |
|-----------|--------|
| `totalStock === 0` | `outofstock` |
| `totalStock <= minStockLevel` | `critical` |
| `totalStock <= minStockLevel * 1.5` | `low` |
| otherwise | `healthy` |

### 1.5 Route Conventions

**`/{id}` is reserved for numeric product IDs only.** Code-based lookups must use explicit paths — never ambiguous root routes.

| Pattern | Purpose | Example |
|---------|---------|---------|
| `GET /api/products/{id}` | Get product by ID | `GET /api/products/15` |
| `PUT /api/products/{id}` | Update product (legacy slim) | `PUT /api/products/15` |
| `DELETE /api/products/{id}` | Soft-delete product | `DELETE /api/products/15` |
| `GET /api/products/code/{code}` | Lookup by business code | `GET /api/products/code/TRP-2024-002` |
| `GET /api/products/barcode/{barcode}` | Lookup by barcode value | `GET /api/products/barcode/6281001001001` |

> **Do not implement** `GET/PUT/DELETE /api/products/{code}` — a product code that is purely numeric (e.g. `12345`) would collide with ID routes and produce inconsistent behavior.

---

## 2. Shared DTOs & Enums

### 2.1 `DescAttributeDto`

Used in list and manage views for product description attributes (Color, Size, etc.).

```json
{
  "id": 1,
  "name": "Color",
  "value": "أصفر",
  "ui": 2
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | number | yes | Attribute definition ID |
| `name` | string | yes | Attribute label |
| `value` | string | yes | Attribute value on this product |
| `ui` | `1 \| 2` | no | Display priority (1 = primary, 2 = secondary) |

---

### 2.2 `ProductBarcodeDto`

```json
{
  "id": 1,
  "barcode": "6281001001001",
  "sellingPrice": 20.00,
  "buyingPrice": 15.00,
  "stock": 125,
  "default": true
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | number | no | Present on read; omit on create |
| `barcode` | string | yes | Unique per product; max 50 chars |
| `sellingPrice` | number | yes | `>= 0`, 2 decimal places |
| `buyingPrice` | number | yes | `>= 0`, 2 decimal places |
| `stock` | integer | yes | `>= 0` |
| `default` | boolean | yes | Exactly one `true` per product |

---

### 2.3 `ProductSummaryDto`

Server-computed aggregates for list display.

```json
{
  "defaultBarcodeId": 1,
  "maxSellingPrice": 25.00,
  "totalStock": 95,
  "barcodeCount": 3
}
```

---

### 2.4 `ProductListItemDto`

Primary DTO for the **Products list page**. Maps directly to frontend `ProductListItem`.

```json
{
  "id": "15",
  "name": "صابون سائل أخضر كيلو",
  "code": "TRP-2024-002",
  "type": "inventory",
  "status": "active",
  "category": "electronics",
  "imageUrl": null,
  "minStockLevel": 5,
  "maxStockLevel": 50,
  "createdAt": "2024-01-10T00:00:00Z",
  "descAttributes": [
    { "id": 1, "name": "Color", "value": "أخضر", "ui": 2 },
    { "id": 2, "name": "Size", "value": "كيلو", "ui": 1 }
  ],
  "barcodes": [ /* ProductBarcodeDto[] */ ],
  "summary": { /* ProductSummaryDto */ }
}
```

---

### 2.5 `ProductCompositionDto`

Describes parent/child and BOM ownership relationships.

```json
{
  "ownerProductId": 15,
  "ownerProductName": "شامبو 500مل",
  "parentProductId": 10,
  "parentProductName": "شامبو"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ownerProductId` | number \| null | yes | Product that owns the BOM |
| `ownerProductName` | string | yes | Display name of owner |
| `parentProductId` | number \| null | no | Set when this product is a variant/child SKU |
| `parentProductName` | string | no | Parent display name |

**Rules:**
- A product cannot be its own parent (`parentProductId !== ownerProductId`).
- Circular parent chains are rejected (`409 Conflict`).
- `bundle` type products typically have a non-empty BOM.
- Child variants inherit `baseName` from parent but have distinct attributes/barcodes.

---

### 2.6 `ProductManageDetailDto`

Full aggregate returned for the **Manage Product** edit form.

```json
{
  "id": 15,
  "baseName": "شامبو",
  "generatedName": "شامبو",
  "type": "bundle",
  "status": "active",
  "attributes": [
    { "id": 1, "name": "اللون", "value": "شفاف" }
  ],
  "barcodes": [
    {
      "barcode": "6281001001001",
      "sellingPrice": 35.00,
      "buyingPrice": 28.00,
      "stock": 50,
      "isDefault": true
    }
  ],
  "categoryId": 2,
  "manufacturerId": 1,
  "supplierIds": [1, 3],
  "composition": {
    "ownerProductId": 15,
    "ownerProductName": "شامبو",
    "parentProductId": null,
    "parentProductName": null
  }
}
```

---

### 2.7 `ProductManageSaveRequest`

Request body for create/update. Maps to frontend `ProductManagePayload`.

```json
{
  "baseName": "شامبو",
  "name": "شامبو 500مل",
  "type": "bundle",
  "status": "active",
  "attributes": [
    { "id": 1, "name": "اللون", "value": "شفاف" }
  ],
  "barcodes": [
    {
      "barcode": "6281001001001",
      "sellingPrice": 35.00,
      "buyingPrice": 28.00,
      "stock": 50,
      "isDefault": true
    }
  ],
  "categoryId": 2,
  "manufacturerId": 1,
  "supplierIds": [1, 3],
  "materials": [
    {
      "materialId": 103,
      "quantity": 1,
      "unitId": 5,
      "wastePercentage": 2,
      "notes": ""
    }
  ],
  "composition": {
    "parentProductId": null
  }
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `baseName` | string | yes | Max 255 chars |
| `name` | string | yes | Generated full name; max 500 chars |
| `type` | ProductType | no | Default `inventory` |
| `status` | ProductStatus | no | Default `draft` on create |
| `attributes` | array | no | No duplicate attribute names |
| `barcodes` | array | yes | Min 1; exactly one `isDefault: true` |
| `categoryId` | number \| null | no | Must exist if provided |
| `manufacturerId` | number \| null | no | Must exist if provided |
| `supplierIds` | number[] | no | All IDs must exist |
| `materials` | array | no | Required for `bundle`; no duplicate `materialId` |
| `composition` | object | no | Parent link; validated for cycles |

---

### 2.8 `ProductMaterialRowDto`

BOM line returned to the materials tab.

```json
{
  "materialId": 103,
  "materialName": "زجاجة بلاستيك",
  "parentProductId": 15,
  "parentProductName": "شامبو 500مل",
  "quantity": 1,
  "unitId": 5,
  "costPerUnit": 10.00,
  "wastePercentage": 2,
  "notes": ""
}
```

---

### 2.9 `ProductMaterialInputDto`

BOM line in save request (no display fields).

```json
{
  "materialId": 103,
  "quantity": 1,
  "unitId": 5,
  "wastePercentage": 2,
  "notes": "ملصق أمامي"
}
```

| Field | Validation |
|-------|------------|
| `materialId` | Required; must exist in catalog |
| `quantity` | Required; `> 0` |
| `unitId` | Required; must exist |
| `wastePercentage` | Optional; `0–100` |
| `notes` | Optional; max 500 chars |

---

### 2.10 Reference Data DTOs

```json
{
  "attributes": [{ "id": 1, "name": "اللون" }],
  "categories": [{ "id": 1, "name": "الكترونيات" }],
  "manufacturers": [{ "id": 1, "name": "شركة أ" }],
  "suppliers": [{ "id": 1, "name": "مورد 1" }]
}
```

---

### 2.11 Material Catalog DTOs

**`MaterialUnitDto`**
```json
{ "id": 1, "name": "كيلوغرام", "abbreviation": "كغ" }
```

**`MaterialCatalogItemDto`**
```json
{
  "id": 103,
  "name": "زجاجة بلاستيك",
  "barcode": "6281001001035",
  "costPerUnit": 10.00,
  "defaultUnitId": 5,
  "type": "inventory"
}
```

---

### 2.12 `CashierProductDto` (Slim — POS Cache)

Backward-compatible shape for Cashier module.

```json
{
  "id": 15,
  "code": "TRP-2024-002",
  "name": "صابون سائل أخضر كيلو",
  "price": 25.00,
  "stock": 95
}
```

> `code` = default barcode or product code; `price` = default barcode selling price; `stock` = sum of all barcode stocks.

---

## 3. Product List & Search

### 3.1 List Products (Paginated + Filtered)

Primary endpoint for the **Products list page**. Replaces client-side filtering when backend is connected.

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products` |
| **Purpose** | Paginated product list with search, filters, and sort |

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Search name, code, barcode, attribute values |
| `category` | string | Category slug or ID |
| `type` | ProductType | `inventory`, `service`, `bundle`, `raw` |
| `stockStatus` | StockStatus | `healthy`, `low`, `critical`, `outofstock` |
| `status` | ProductStatus | `active`, `inactive`, `draft` |
| `priceMin` | number | Min default/max selling price |
| `priceMax` | number | Max selling price |
| `stockMin` | number | Min total stock |
| `stockMax` | number | Max total stock |
| `dateFrom` | ISO date | Created on or after |
| `dateTo` | ISO date | Created on or before |
| `parentProductId` | number | Filter children of a parent product |
| `page` | integer | Default `0` |
| `size` | integer | Default `20` |
| `sort` | string | Default `createdAt,DESC` |

**Sample Request**
```
GET /api/products?query=صابون&type=inventory&stockStatus=low&page=0&size=20&sort=name,ASC
```

**Sample Response** `200 OK`
```json
{
  "content": [
    {
      "id": "2",
      "name": "صابون سائل أخضر كيلو",
      "code": "TRP-2024-002",
      "type": "inventory",
      "status": "active",
      "category": "electronics",
      "minStockLevel": 5,
      "maxStockLevel": 50,
      "createdAt": "2024-01-10T00:00:00Z",
      "descAttributes": [
        { "id": 1, "name": "Color", "value": "أخضر", "ui": 2 }
      ],
      "barcodes": [
        {
          "id": 2,
          "barcode": "6281001002002",
          "sellingPrice": 25.00,
          "buyingPrice": 19.00,
          "stock": 45,
          "default": true
        }
      ],
      "summary": {
        "defaultBarcodeId": 2,
        "maxSellingPrice": 25.00,
        "totalStock": 95,
        "barcodeCount": 3
      }
    }
  ],
  "totalElements": 16,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "page": 0,
  "last": true,
  "first": true,
  "hasNext": false,
  "hasPrevious": false,
  "numberOfElements": 16,
  "empty": false
}
```

**Behavior**
- `summary` fields are always server-computed.
- `stockStatus` filter uses `minStockLevel` thresholds per product.
- Empty result returns `empty: true`, not `404`.

---

### 3.2 Filter Products (Alias — Frontend Compatible)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/filter` |
| **Purpose** | Same as §3.1; alias for `ProductApiService.filterProducts()` |

Accepts identical query parameters. Returns `PageResponseDto<ProductListItemDto>`.

> **Recommendation:** Implement as alias to `GET /api/products` internally.

---

### 3.3 Quick Search

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/search` |
| **Purpose** | Typeahead / quick search (non-paginated, max 50 results) |

**Query Parameters**

| Param | Type | Default |
|-------|------|---------|
| `query` | string | `""` |
| `limit` | integer | `50` |

**Sample Response** `200 OK`
```json
[
  {
    "id": "2",
    "name": "صابون سائل أخضر كيلو",
    "code": "TRP-2024-002",
    "type": "inventory",
    "status": "active",
    "summary": { "maxSellingPrice": 25.00, "totalStock": 95, "barcodeCount": 3, "defaultBarcodeId": 2 }
  }
]
```

---

## 4. Product Lookup

### 4.1 Get Product by ID

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}` |
| **Purpose** | List-item view of a single product |

**Path Variables:** `id` — numeric product ID

**Sample Response** `200 OK` — `ProductListItemDto`

---

### 4.2 Get Product by Code

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/code/{code}` |
| **Purpose** | Lookup by business product code (e.g. `TRP-2024-002`) |

**Sample Response** `200 OK` — `ProductListItemDto`

---

### 4.3 Get Product by Barcode

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/barcode/{barcode}` |
| **Purpose** | Barcode scan lookup (Cashier + Products) |

**Sample Response** `200 OK` — `ProductListItemDto`

**Behavior**
- Searches all barcode records across products.
- Returns the owning product with the matched barcode highlighted (`default: true` on matched if applicable).
- `404` if barcode not found.

---

## 5. Product Management (CRUD Aggregate)

### 5.1 Get Product Detail (Edit Form)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/detail/{id}` |
| **Purpose** | Load full manage form for edit mode |

**Frontend:** `ProductApiService.getProductDetail(id)`

**Sample Response** `200 OK`
```json
{
  "id": 15,
  "baseName": "شامبو",
  "generatedName": "شامبو",
  "type": "bundle",
  "status": "active",
  "attributes": [],
  "barcodes": [],
  "categoryId": null,
  "manufacturerId": null,
  "supplierIds": [],
  "composition": {
    "ownerProductId": 15,
    "ownerProductName": "شامبو",
    "parentProductId": null,
    "parentProductName": null
  }
}
```

**Behavior**
- Does **not** include materials; load via §7.1 separately (matches current frontend two-step load).
- `generatedName` = `baseName` + attribute values joined.

---

### 5.2 Create Product

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/products/detail` |
| **Purpose** | Create a new product with full aggregate |

**Frontend:** `ProductApiService.saveProduct(payload)` when `payload.id` is null

**Request Body:** `ProductManageSaveRequest`

**Sample Response** `201 Created`
```json
{
  "id": 17,
  "baseName": "شامبو",
  "generatedName": "شامبو 500مل",
  "type": "bundle",
  "status": "draft",
  "attributes": [],
  "barcodes": [ /* saved barcodes with IDs */ ],
  "categoryId": 2,
  "manufacturerId": 1,
  "supplierIds": [1],
  "materials": [ /* saved BOM */ ],
  "composition": {
    "ownerProductId": 17,
    "ownerProductName": "شامبو 500مل",
    "parentProductId": null,
    "parentProductName": null
  }
}
```

**Behavior**
- Auto-generates product `code` if not supplied (e.g. `PRD-2026-00017`).
- Validates barcode uniqueness globally.
- Saves BOM atomically with product.
- Sets `composition.ownerProductId` to new product ID.
- Returns full saved aggregate.

**Validation Errors** `400`
```json
{
  "message": "Validation failed",
  "status": 400,
  "errors": {
    "baseName": "اسم المنتج مطلوب",
    "barcodes": "يجب إضافة باركود واحد على الأقل",
    "materials": "لا يمكن تكرار نفس المادة"
  }
}
```

---

### 5.3 Update Product

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/products/detail/{id}` |
| **Purpose** | Replace full product aggregate |

**Frontend:** `ProductApiService.saveProduct(payload)` when `payload.id` is set

**Request Body:** `ProductManageSaveRequest`

**Sample Response** `200 OK` — same shape as §5.2 response

**Behavior**
- Full replace semantics for barcodes, attributes, suppliers, and materials.
- Barcodes not in request are soft-deleted.
- Materials not in request are removed from BOM.
- Updates `composition.ownerProductName` when `name` changes.
- Rejects update if product is referenced as parent and the update would break child integrity.

---

### 5.4 Delete Product

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/products/{id}` |
| **Purpose** | Soft-delete product from list |

**Frontend:** `ProductStateService.deleteProduct(productId)` → `DELETE /api/products/{id}`

**Sample Response** `204 No Content`

**Behavior**
- Soft delete only — the record is never physically removed.
- Sets `deletedAt` to the current timestamp and `status` to `deleted`.
- Soft-deletes all active barcodes on the product (sets their `deletedAt`).
- Excluded from list, search, filter, lookup, and cashier cache.
- `409 Conflict` if product has active children or is referenced in open receipts.
- Cascade options (configurable): deactivate children vs. orphan them.
- `404 Not Found` if the product is already deleted or does not exist.

---

### 5.5 Update Product Status

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/products/{id}/status` |
| **Purpose** | Activate, deactivate, or draft a product without full edit |

**Request Body**
```json
{ "status": "inactive" }
```

**Sample Response** `200 OK`
```json
{ "id": 15, "status": "inactive", "updatedAt": "2026-07-11T01:42:00Z" }
```

**Behavior**
- Allowed values: `active`, `inactive`, `draft`.
- `deleted` is rejected (`400`) — use `DELETE /api/products/{id}` (§5.4).

---

## 6. Product Composition & Parent/Child

### 6.1 Get Composition Context

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/composition` |
| **Purpose** | Read parent/child relationship for a product |

**Sample Response** `200 OK`
```json
{
  "ownerProductId": 15,
  "ownerProductName": "شامبو 500مل",
  "parentProductId": 10,
  "parentProductName": "شامبو",
  "childCount": 3,
  "isCompound": true
}
```

---

### 6.2 Set Parent Product (Variant Link)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/products/{id}/composition` |
| **Purpose** | Link product as child/variant of a parent |

**Request Body**
```json
{
  "parentProductId": 10
}
```

Pass `"parentProductId": null` to unlink.

**Sample Response** `200 OK` — `ProductCompositionDto`

**Behavior**
- Validates no circular references.
- Parent must be `inventory` or `bundle` type.
- Child inherits `baseName` suggestion from parent (UI hint only).

**Error** `409 Conflict`
```json
{
  "message": "Circular parent reference detected",
  "status": 409
}
```

---

### 6.3 List Child / Variant Products

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/children` |
| **Purpose** | List all variant/child SKUs under a parent product |

**Query Parameters:** `page`, `size`, `sort`

**Sample Response** `200 OK` — `PageResponseDto<ProductListItemDto>`

---

## 7. Bill of Materials (BOM)

### 7.1 Get Product Materials

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/materials` |
| **Purpose** | Load BOM for the materials tab in edit mode |

**Frontend:** `ProductApiService.getProductMaterials(productId)`

**Sample Response** `200 OK`
```json
[
  {
    "materialId": 103,
    "materialName": "زجاجة بلاستيك",
    "parentProductId": 15,
    "parentProductName": "شامبو 500مل",
    "quantity": 1,
    "unitId": 5,
    "costPerUnit": 10.00,
    "wastePercentage": 2,
    "notes": ""
  },
  {
    "materialId": 102,
    "materialName": "عطر",
    "parentProductId": 15,
    "parentProductName": "شامبو 500مل",
    "quantity": 50,
    "unitId": 4,
    "costPerUnit": 20.00,
    "wastePercentage": 3,
    "notes": ""
  }
]
```

**Behavior**
- `parentProductId` / `parentProductName` on each row = BOM owner (the composed product).
- `costPerUnit` snapshotted from catalog at time of save; refreshed on read if catalog price changed (configurable).
- Returns `[]` for products without BOM.

---

### 7.2 Replace Product Materials

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/products/{id}/materials` |
| **Purpose** | Replace entire BOM (used when saving materials independently) |

**Request Body**
```json
{
  "materials": [
    { "materialId": 103, "quantity": 1, "unitId": 5, "wastePercentage": 2, "notes": "" },
    { "materialId": 102, "quantity": 50, "unitId": 4, "wastePercentage": 3, "notes": "" }
  ]
}
```

**Sample Response** `200 OK` — `ProductMaterialRowDto[]`

**Validation**
- No duplicate `materialId` (`422` if violated).
- `quantity > 0` required.
- `wastePercentage` between 0 and 100.

> **Note:** The manage form currently saves materials as part of the full aggregate (§5.2/§5.3). This endpoint supports independent BOM updates.

---

### 7.3 Get BOM Cost Summary

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/materials/cost-summary` |
| **Purpose** | Server-side total material cost (validates against frontend `totalMaterialCost`) |

**Sample Response** `200 OK`
```json
{
  "productId": 15,
  "totalMaterialCost": 1015.00,
  "lineCount": 3,
  "currency": "SAR"
}
```

---

## 8. Barcodes

### 8.1 List Barcodes

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/barcodes` |
| **Purpose** | All barcodes for a product (popover in list page) |

**Sample Response** `200 OK` — `ProductBarcodeDto[]`

---

### 8.2 Add Barcode

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/products/{id}/barcodes` |
| **Purpose** | Add a single barcode without full product update |

**Request Body**
```json
{
  "barcode": "6281001002999",
  "sellingPrice": 30.00,
  "buyingPrice": 22.00,
  "stock": 10,
  "isDefault": false
}
```

**Sample Response** `201 Created` — `ProductBarcodeDto`

---

### 8.3 Delete Barcode

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/products/{id}/barcodes/{barcodeId}` |
| **Purpose** | Remove a barcode |

**Behavior:** `400` if deleting the only barcode; auto-promotes another to default if deleted barcode was default.

---

## 9. Reference Data

### 9.1 Get All Reference Data

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/reference-data` |
| **Purpose** | Bootstrap manage form dropdowns |

**Frontend:** replaces `ProductSeedService.getReferenceData()`

**Sample Response** `200 OK`
```json
{
  "attributes": [
    { "id": 1, "name": "اللون" },
    { "id": 2, "name": "الوزن" }
  ],
  "categories": [
    { "id": 1, "name": "الكترونيات" },
    { "id": 2, "name": "منظفات" }
  ],
  "manufacturers": [
    { "id": 1, "name": "شركة أ" }
  ],
  "suppliers": [
    { "id": 1, "name": "مورد 1" }
  ]
}
```

---

### 9.2 Create Reference Entity

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/products/reference-data/{type}` |
| **Purpose** | Add category, manufacturer, supplier, or attribute from overlay UI |

**Path `type`:** `categories` | `manufacturers` | `suppliers` | `attributes`

**Request Body**
```json
{ "name": "مستحضرات تجميل" }
```

**Sample Response** `201 Created`
```json
{ "id": 4, "name": "مستحضرات تجميل" }
```

**Frontend:** `ProductManageStateService.addNewReferenceItem()`

---

## 10. Material Catalog

### 10.1 Search Material Catalog

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/materials/catalog` |
| **Purpose** | Autocomplete search in materials tab |

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `query` | string | Name or barcode search |
| `excludeIds` | number[] | Already-added material IDs (repeat param or comma-separated) |
| `limit` | integer | Default `20` |

**Sample Request**
```
GET /api/products/materials/catalog?query=عطر&excludeIds=103&excludeIds=104
```

**Sample Response** `200 OK`
```json
[
  {
    "id": 102,
    "name": "عطر",
    "barcode": "6281001001028",
    "costPerUnit": 20.00,
    "defaultUnitId": 4,
    "type": "raw"
  }
]
```

---

### 10.2 Get Material Units

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/materials/units` |
| **Purpose** | Unit dropdown in materials tab |

**Sample Response** `200 OK` — `MaterialUnitDto[]`

---

### 10.3 Get Material by ID

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/materials/catalog/{materialId}` |
| **Purpose** | Single catalog item detail |

**Sample Response** `200 OK` — `MaterialCatalogItemDto`

---

## 11. Inventory Operations

### 11.1 Get Stock Summary

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/stock` |
| **Purpose** | Aggregated stock across all barcodes with status |

**Sample Response** `200 OK`
```json
{
  "productId": 15,
  "totalStock": 150,
  "stockStatus": "healthy",
  "minStockLevel": 10,
  "maxStockLevel": 1000,
  "barcodes": [
    { "barcodeId": 1, "barcode": "123456", "stock": 50 },
    { "barcodeId": 2, "barcode": "999999", "stock": 60, "default": true }
  ]
}
```

---

### 11.2 Adjust Stock

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/products/{id}/stock/adjust` |
| **Purpose** | Manual stock correction per barcode |

**Request Body**
```json
{
  "barcodeId": 2,
  "adjustment": -5,
  "reason": "جرد دوري",
  "notes": "تالف"
}
```

| Field | Validation |
|-------|------------|
| `barcodeId` | Required; must belong to product |
| `adjustment` | Non-zero integer (positive = add, negative = subtract) |
| `reason` | Required enum: `COUNT`, `DAMAGE`, `RETURN`, `CORRECTION`, `OTHER` |
| `notes` | Optional |

**Sample Response** `200 OK`
```json
{
  "productId": 15,
  "barcodeId": 2,
  "previousStock": 60,
  "newStock": 55,
  "adjustment": -5,
  "movementId": 9001
}
```

**Behavior**
- Rejects adjustments that would result in negative stock (`400`).
- Creates an audit record (§11.3).

---

### 11.3 List Stock Movements

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/stock/movements` |
| **Purpose** | Inventory audit trail |

**Query Parameters:** `page`, `size`, `dateFrom`, `dateTo`, `reason`

**Sample Response** `200 OK`
```json
{
  "content": [
    {
      "id": 9001,
      "productId": 15,
      "barcodeId": 2,
      "adjustment": -5,
      "previousStock": 60,
      "newStock": 55,
      "reason": "COUNT",
      "notes": "تالف",
      "createdAt": "2026-07-11T01:42:00Z",
      "createdBy": "admin"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

---

### 11.4 Compute Compound Stock (Bundle)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/{id}/stock/compound` |
| **Purpose** | For `bundle` products, compute max producible quantity from BOM material stock |

**Sample Response** `200 OK`
```json
{
  "productId": 15,
  "maxProducible": 42,
  "limitingMaterialId": 103,
  "limitingMaterialName": "زجاجة بلاستيك",
  "components": [
    { "materialId": 103, "requiredPerUnit": 1, "availableStock": 42, "maxProducible": 42 },
    { "materialId": 102, "requiredPerUnit": 50, "availableStock": 5000, "maxProducible": 100 }
  ]
}
```

---

## 12. Cashier Integration (Legacy Slim Endpoints)

These endpoints already exist in the backend and **must remain backward-compatible** with `CashierApiService` and `CashierStateService`.

### 12.1 Get All Products (POS Cache)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/products/all-products` |
| **Purpose** | Load slim product cache for cashier scanning |

**Sample Response** `200 OK`
```json
[
  { "id": 15, "code": "999999", "name": "سلفونيك", "price": 38.00, "stock": 150 }
]
```

**Mapping:** `code` = default barcode; `price` = default barcode `sellingPrice`; `stock` = `summary.totalStock`.

---

### 12.2 Legacy Create/Update/Delete

| Method | URL | Purpose |
|--------|-----|---------|
| `POST` | `/api/products` | Simple create (`CreateProductRequest`: code, name, price, stock) |
| `PUT` | `/api/products/{id}` | Simple update by product ID (legacy slim) |
| `DELETE` | `/api/products/{id}` | Soft-delete by product ID (same semantics as §5.4) |

> Legacy slim endpoints use **product ID** for mutations. Code lookups use `GET /api/products/code/{code}` (§4.2). New development should use §5 aggregate endpoints (`/detail`).

---

## 13. Frontend Mapping Notes

### 13.1 Service → Endpoint Map

| Frontend Method | Endpoint | State Service |
|-----------------|----------|---------------|
| `getAllProducts()` | `GET /all-products` | `ProductStateService` (transition) |
| `filterProducts(params)` | `GET /` or `/filter` | `ProductStateService` |
| `getProductById(id)` | `GET /{id}` | `ProductApiService` |
| `getProductByCode(code)` | `GET /code/{code}` | `ProductApiService` |
| `getProductDetail(id)` | `GET /detail/{id}` | `ProductManageStateService` |
| `getProductMaterials(id)` | `GET /{id}/materials` | `ProductManageStateService` |
| `saveProduct(payload)` | `POST/PUT /detail[/id]` | `ProductManageStateService` |
| `deleteProduct(id)` | `DELETE /{id}` | `ProductStateService` |
| `getProductByBarcode(barcode)` | `GET /barcode/{barcode}` | `CashierApiService` |

### 13.2 Enabling Backend in State Services

```typescript
// product-state.service.ts & product-manage-state.service.ts
private readonly useSeedData = false;
```

### 13.3 Recommended Migration Path

| Phase | Action |
|-------|--------|
| **Phase 1** | Implement §12 (Cashier slim) — already partially done |
| **Phase 2** | Implement §3 paginated list + §5 manage aggregate |
| **Phase 3** | Implement §9 reference data + §10 material catalog |
| **Phase 4** | Implement §6 composition + §7 BOM |
| **Phase 5** | Implement §11 inventory operations |

### 13.4 ID Type Consistency

| Context | ID Type | Notes |
|---------|---------|-------|
| List page (`ProductListItem`) | `string` | Frontend uses string IDs; API may return numeric as string |
| Manage page (`ProductManageDetail`) | `number` | Edit route uses `/manage/:id` as number |
| Cashier cache | `number` | `CashierProductDto.id` |

**Recommendation:** API always uses numeric `id` internally; serialize as string in list DTO if needed for frontend compatibility.

---

## Appendix A — Endpoint Summary

| # | Method | URL | Purpose |
|---|--------|-----|---------|
| 1 | GET | `/api/products` | Paginated list + filters |
| 2 | GET | `/api/products/filter` | Filter alias |
| 3 | GET | `/api/products/search` | Quick search |
| 4 | GET | `/api/products/{id}` | Get by ID |
| 5 | GET | `/api/products/code/{code}` | Get by code |
| 6 | GET | `/api/products/barcode/{barcode}` | Get by barcode |
| 7 | GET | `/api/products/detail/{id}` | Manage form load |
| 8 | POST | `/api/products/detail` | Create aggregate |
| 9 | PUT | `/api/products/detail/{id}` | Update aggregate |
| 10 | DELETE | `/api/products/{id}` | Soft delete |
| 11 | PATCH | `/api/products/{id}/status` | Status toggle |
| 12 | GET | `/api/products/{id}/composition` | Composition context |
| 13 | PUT | `/api/products/{id}/composition` | Set parent link |
| 14 | GET | `/api/products/{id}/children` | List child variants |
| 15 | GET | `/api/products/{id}/materials` | Get BOM |
| 16 | PUT | `/api/products/{id}/materials` | Replace BOM |
| 17 | GET | `/api/products/{id}/materials/cost-summary` | BOM cost |
| 18 | GET | `/api/products/{id}/barcodes` | List barcodes |
| 19 | POST | `/api/products/{id}/barcodes` | Add barcode |
| 20 | DELETE | `/api/products/{id}/barcodes/{barcodeId}` | Remove barcode |
| 21 | GET | `/api/products/reference-data` | Reference bootstrap |
| 22 | POST | `/api/products/reference-data/{type}` | Add reference entity |
| 23 | GET | `/api/products/materials/catalog` | Search materials |
| 24 | GET | `/api/products/materials/units` | Material units |
| 25 | GET | `/api/products/materials/catalog/{id}` | Material detail |
| 26 | GET | `/api/products/{id}/stock` | Stock summary |
| 27 | POST | `/api/products/{id}/stock/adjust` | Stock adjustment |
| 28 | GET | `/api/products/{id}/stock/movements` | Movement history |
| 29 | GET | `/api/products/{id}/stock/compound` | Bundle producible qty |
| 30 | GET | `/api/products/all-products` | Cashier cache (legacy) |
| 31 | POST | `/api/products` | Simple create (legacy) |
| 32 | PUT | `/api/products/{id}` | Simple update (legacy) |
| 33 | DELETE | `/api/products/{id}` | Soft delete (legacy alias) |

---

*Document version: 1.0 — aligned with frontend Products module refactor (July 2026)*
