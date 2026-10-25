# Comax order integration starter (Node.js + Vue)

This starter calls Comax's SOAP 1.1 `WriteCustomersOrderByParamsExtendedPlusPrice` operation from a Node.js backend. Vue calls your backend over JSON; Comax credentials stay server-side.

## Requirements
- Node.js 20+
- Comax LoginID/LoginPassword and the correct CustomerID/StoreID/PriceListID values
- Confirm with Comax which fields are required for your account, date formats, and accepted values for `Mode`, `Status`, and `PayType`.

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set real values in `backend/.env`. Never commit that file.

The API listens on `http://localhost:3000`. Test with the sample JSON below, replacing customer and SKU/item identifiers with valid Comax values:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId":"YOUR_CUSTOMER_ID",
    "reference":"web-order-10001",
    "remarks":"Website order",
    "items":[
      {"sku":"YOUR_COMAX_ITEM_ID","quantity":2,"price":19.9,"discountPercent":0,"remarks":""}
    ],
    "customer":{"name":"Test Customer","phone":"0500000000"},
    "delivery":{"city":"Tel Aviv","address":"Example Street","addressNumber":"1"}
  }'
```

## Vue
Copy `frontend/src/services/comaxOrders.js` into your Vue app and call `createComaxOrder(order)`. Ensure your Vue dev server proxies `/api` to `http://localhost:3000`, or set `VITE_API_BASE_URL`.

## Important integration notes
- The SOAP operation uses parallel arrays for item IDs, quantities, prices, discounts, totals, etc. This implementation builds them from the same `items` array to preserve alignment.
- SOAP's response can contain business-level errors even when HTTP status is 200. The backend returns those errors to Vue.
- Do not blindly retry a timed-out create-order request: Comax may have created the order before the connection failed. Use a unique `reference` and confirm Comax duplicate-reference behavior with your Comax administrator.
- This starter intentionally does not submit card numbers, CVV, or identity numbers. Use a compliant payment provider/token flow if payment processing is needed.
- The exact mandatory fields and date formats depend on your Comax setup. Validate with Comax using a test customer and test items before production.


## Vue 3 checkout component

`frontend/src/components/ComaxCheckoutSubmit.vue` is a Vue 3 `<script setup>` example.
Pass it the cart, Comax customer ID, your durable order reference, and customer contact fields:

```vue
<ComaxCheckoutSubmit
  :cart="cart"
  :customer-id="comaxCustomerId"
  :order-reference="checkoutOrderId"
  :customer="customer"
  @created="onOrderCreated"
  @error="onOrderError"
/>
```

Adapt the prop names to your checkout store. Do not create a fresh random reference on every retry. Use the durable ID for the local checkout/order so a retry uses the same reference.

## Comax settings to confirm before production

The WSDL page documents the SOAP 1.1 operation and the listed fields. It does not establish the correct business values for your tenant. Confirm these with your Comax administrator:

1. `LoginID` and `LoginPassword` are authorized for this service and allowed to create customer orders.
2. `CustomerID`: whether it is an existing Comax customer ID or whether guest/new customers are supported by your configuration.
3. `StoreID` and `PriceListID`: valid IDs for the intended store and price list.
4. `Mode`: `Add`, `Update`, or `AddOrUpdate`; for checkout creation this is usually a create mode, but confirm which mode your account expects.
5. `Reference`: required format, maximum length, and whether Comax enforces duplicate references. The response schema labels it as `long`, while the request accepts a string; confirm permitted format before using UUIDs or prefixed web IDs.
6. `Items`: whether each `sku` must be a Comax item code, barcode, or internal item ID.
7. `Quantity`, `Price`, `DiscountPercent`, and `TotalSum`: whether price is tax-inclusive, rounding precision, discount rules, and whether totals should be supplied or derived by Comax.
8. `PriceFromPriceList`: expected boolean-like string and whether Comax should calculate the item price from the configured price list instead of honoring the supplied price.
9. `DoJ5`: whether this flag is required and what value is accepted for a normal website order.
10. `Status`: whether mandatory, and which status ID means a newly created website order.
11. `PayType`: whether a basic unpaid order should omit this field or use a configured value. If payment occurs online, agree how the payment provider's transaction/token should be represented; do not send raw card data through this integration.
12. Date format and timezone for `DoJ5`/order date fields, if your account requires them.
13. Whether `CustomerName`, address, phone, and other customer fields should be sent when `CustomerID` already identifies the customer.
14. Test environment or safe test customer/items and a test order workflow.

Known API error values include `InvalidCustomer`, `InvalidUser`, `InvalidItem`, `InvalidQuantity`, `InvalidPrice`, `NoItems`, `InvalidStore`, `InvalidPayType`, `MissingReference`, `MissingOrderDate`, `MissingStatus`, `DoubleReference`, and `SystemFailure`. Map these into user-safe checkout messages; don't show raw service internals to shoppers.

## Production hardening still required

- Add authentication/authorization to `POST /api/orders`; CORS is not authentication.
- Load item prices and customer IDs from trusted server-side checkout data. Do not trust client-supplied price/discount/total.
- Persist a local order state and idempotency key before calling Comax. On timeout, query/reconcile the existing Comax order before retrying.
- Add rate limits, request IDs, structured safe logs, and integration tests using Comax's test environment.
- Keep `.env` out of source control and use a secret manager in production.
