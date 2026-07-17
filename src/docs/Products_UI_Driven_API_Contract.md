# UI-Driven Products API Contract

This API contract is designed around the frontend screens (Products List and Create/Edit Product), providing a clean, RESTful interface tailored for the UI rather than exposing internal database entities.

## Products Page

### 1. List Products

**`GET /api/products`**

Supports pagination, sorting, filtering, and searching.

#### Request

**Query Parameters**

| Name | Type | Description |
|------|------|-------------|
| query | string | Search term |
| categoryId | number | Filter by category |
| manufacturerId | number | Filter by manufacturer |
| supplierId | number | Filter by supplier |
| status | string | Filter by status |
| page | integer | Page number (0-based) |
| size | integer | Page size |
| sort | string | Sort criteria (e.g., `name,asc`) |

#### Response

```json
{
  "content": [
    {
      "id": 15,
      "name": "Shampoo",
      "code": "PRD-001",
      "category": "Cosmetics",
      "manufacturer": "ABC",
      "sellingPrice": 35,
      "stock": 50,
      "status": "active"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 120,
  "totalPages": 6
}
```

### 2. View Product

**`GET /api/products/{id}`**

Returns the entire product object used by the Create/Edit page. All related details (materials, barcodes, composition) come from this single endpoint.

### 3. Delete Product

**`DELETE /api/products/{id}`**

#### Response
`204 No Content`

---

## Product Form (Create / Edit)

The same payload is used for both Create and Update operations.

### 4. Create Product

**`POST /api/products`**

#### Request

```json
{
  "baseName": "شامبو",
  "name": "شامبو شفاف",
  "status": "active",
  "attributes": [ { "id": 1, "name": "اللون", "value": "شفاف" } ],
  "barcodes": [ { "barcode": "6281001001001", "sellingPrice": 35.00, "buyingPrice": 28.00, "stock": 50, "isDefault": true } ],
  "categoryId": 2,
  "manufacturerId": 1,
  "supplierIds": [1, 3],
  "hasConversion": true,
  "conversions": [
    {
      "parentProductId": 103,
      "parentQuantity": 1,
      "childQuantity": 12
    }
  ],
  "hasMaterials": false,
  "materials": []
}
```

#### Response

```json
{
  "id": 15
}
```

### 5. Update Product

**`PUT /api/products/{id}`**

#### Request

Exactly the same payload as **Create Product**.

#### Response

```json
{
  "id": 15
}
```

---

## Lookup Endpoints

Expose only the four lookup APIs needed to populate the dropdowns on the UI screens.

### 6. Categories

**`GET /api/lookups/categories`**

#### Response

```json
[
  {
    "id": 1,
    "name": "Electronics"
  }
]
```

### 7. Manufacturers

**`GET /api/lookups/manufacturers`**

#### Response

```json
[
  {
    "id": 1,
    "name": "ABC Company"
  }
]
```

### 8. Suppliers

**`GET /api/lookups/suppliers`**

#### Response

```json
[
  {
    "id": 1,
    "name": "Supplier 1"
  }
]
```

### 9. Attributes

**`GET /api/lookups/attributes`**

#### Response

```json
[
  {
    "id": 1,
    "name": "Color"
  }
]
```

---

## Final Contract Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/products` | Product list with pagination & filters |
| `GET` | `/api/products/{id}` | View/Edit product |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/{id}` | Update product |
| `DELETE` | `/api/products/{id}` | Delete product |
| `GET` | `/api/lookups/categories` | Categories lookup |
| `GET` | `/api/lookups/manufacturers`| Manufacturers lookup |
| `GET` | `/api/lookups/suppliers` | Suppliers lookup |
| `GET` | `/api/lookups/attributes` | Attributes lookup |

---

## Endpoints to Remove

These endpoints from the original backend contract do not match the current UI requirements and can be safely removed:

- `/products/filter`
- `/products/search`
- `/products/code/{code}`
- `/products/barcode/{barcode}`
- `/products/detail/*`
- `/products/{id}/composition`
- `/products/{id}/children`
- `/products/{id}/materials`
- `/products/{id}/materials/cost-summary`
- `/products/{id}/barcodes`
- `/products/reference-data`
- `/products/reference-data/{type}`
- `/products/materials/*`
- `/products/{id}/stock`
- `/products/{id}/stock/adjust`
- `/products/{id}/stock/movements`
- `/products/{id}/stock/compound`
- `/products/all-products`
- Legacy `POST /api/products`
- Legacy `PUT /api/products/{id}`
- `PATCH /api/products/{id}/status`
