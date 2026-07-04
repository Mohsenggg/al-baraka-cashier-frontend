# Cashier Backend API Contract

This API specification is derived directly from the frontend
implementation of the Cashier module. It outlines the exact endpoints,
HTTP methods, payloads, and response structures the frontend expects to
function correctly.

> \[!NOTE\] All paths below are relative to your base API path (e.g.,
> `/api/v1`).

------------------------------------------------------------------------

## 1. Receipt Endpoints

### 1.1 Create Receipt (Save/Checkout)

Creates a new receipt (checkout transaction).

-   **HTTP Method**: `POST`
-   **URL**: `/receipt`
-   **Purpose**: Saves a completed cart transaction into a receipt.
-   **Path Variables**: None
-   **Query Parameters**: None
-   **Request Body**: `CreateReceiptInput`

``` json
{
  "customerName": "string",
  "customerId": "number | null",
  "cashierId": "number",
  "paymentMethod": "CASH | TRANSFER",
  "receiptType": "string (e.g., 'SELL')",
  "totalQuantity": "number",
  "tax": "number (optional)",
  "discount": "number (optional)",
  "items": [
    {
      "productCode": "string",
      "price": "number",
      "quantity": "number",
      "total": "number",
      "remainingStock": "number"
    }
  ]
}
```

-   **Response Body**: `ReceiptResponse`
-   **HTTP Status Codes**:
    -   `201 Created` - Successfully created
    -   `400 Bad Request` - Validation errors (e.g., insufficient stock)

### 1.2 Get Receipts (Basic Pagination)

-   **HTTP Method**: `GET`
-   **URL**: `/receipt`
-   **Purpose**: Load initial receipt history for the sidebar.

### 1.3 Filter Receipts (Advanced Search)

-   **HTTP Method**: `GET`
-   **URL**: `/receipt/filter`

### 1.4 Get Receipt by ID

-   **HTTP Method**: `GET`
-   **URL**: `/receipt/{id}`

### 1.5 Update Receipt

-   **HTTP Method**: `PUT`
-   **URL**: `/receipt/{id}`

### 1.6 Delete Receipt

-   **HTTP Method**: `DELETE`
-   **URL**: `/receipt/{id}`

------------------------------------------------------------------------

## 2. Product Endpoints (Caching & Searching)

### 2.1 Get All Products

-   **HTTP Method**: `GET`
-   **URL**: `/products/all-products`

### 2.2 Get Product By Barcode (Fallback)

-   **HTTP Method**: `GET`
-   **URL**: `/products/barcode/{barcode}`
