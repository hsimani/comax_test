# Repository guidance

## Project shape

This repository has three distinct parts:

- `backend/` is the Node.js 20+ Express API. `src/server.js` exposes `/health` and `POST /api/orders`; it validates JSON with the Zod schema in `src/orderSchema.js`, then calls the Comax adapter in `src/comax.js`.
- `src/comax.js` builds and sends the Comax SOAP 1.1 `WriteCustomersOrderByParamsExtendedPlusPrice` request, validates/parses the XML response, and maps business errors into the API result. Comax credentials and endpoint configuration belong in the backend environment, never in browser code.
- `frontend/` contains reusable Vue checkout integration examples: the API client, submit component, and example call. The root README describes copying these into an existing Vue app.
- `frontend_comax/` is a separate Vue 3 + Vite starter app. It currently contains a local demo form, not the Comax checkout integration.

The request flow is browser JSON → Express/Zod → SOAP adapter → Comax. HTTP-successful SOAP responses can still contain business errors; the API returns those as `422`. Keep request validation in the schema and preserve this distinction when changing the endpoint or client.

## Commands

Run commands from the relevant package directory; there is no root package manifest.

Backend (`backend/`):

```bash
npm install
npm run dev
npm start
```

`dev` runs the API with Node's watch mode; `start` runs it normally. Configure local values from `.env.example` in an untracked `.env` file before making Comax requests.

Vue starter (`frontend_comax/`):

```bash
npm install
npm run dev
npm run build
npm run preview
```

There are currently no test files or test/lint scripts in either package. If adding Node tests, run one test file from `backend/` with `node --test test/<file>.test.js`; no equivalent frontend test runner is configured.

## Integration conventions

- Keep all Comax SOAP construction and credentials on the backend. The frontend calls only `/api/orders`; `VITE_API_BASE_URL` can set its API base URL.
- When changing the SOAP operation, preserve its documented field order and XML escaping. All item data is sent as parallel SOAP arrays generated from the same `items` list, so each array must stay aligned and have the same length.
- Treat the Zod schema as the API payload contract. Keep bounds and required fields there rather than relying on browser validation.
- Comax tenant-specific values (IDs, modes, statuses, accepted dates and payment values) must be confirmed with the Comax administrator; do not assume examples or defaults are production-valid.
- Do not log SOAP bodies or credentials. Never send raw card details or CVV; the adapter intentionally leaves those fields blank and supports a token field.
- Order creation may succeed at Comax even if the client times out. Keep references durable across retries and do not add blind automatic retries; reconcile with Comax first.
- The reusable examples in `frontend/` are not wired into `frontend_comax/`. If integrating them into the starter, keep that change explicit and preserve the distinction between its local demo and the Comax checkout flow.
